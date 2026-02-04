import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Minimize2, Zap } from 'lucide-react';
import { compressImage, batchCompress } from './utils/compression';
import { formatBytes, validateFile, validateDimensions } from './utils/validation';
import { cacheManager } from './utils/cache';
import { analyticsManager } from './utils/analytics';
import { COMPRESSION_PRESETS, ERROR_MESSAGES } from './config/constants';
import PresetSelector from './components/PresetSelector';
import HistoryPanel from './components/HistoryPanel';

export default function ImageCompressor() {
  // State
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [compressedDimensions, setCompressedDimensions] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [fileName, setFileName] = useState('');
  const [quality, setQuality] = useState(80);
  const [selectedFormat, setSelectedFormat] = useState('jpeg');
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1920);
  const fileInputRef = useRef(null);
  const batchInputRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    cacheManager.initDB().then(() => {
      cacheManager.clearExpiredCache();
    });
  }, []);

  // Apply preset
  const applyPreset = (presetKey) => {
    const preset = COMPRESSION_PRESETS[presetKey];
    if (preset) {
      setSelectedPreset(presetKey);
      setQuality(preset.quality);
      setSelectedFormat(preset.formats[0]);
      analyticsManager.trackEvent('preset_used', { preset: presetKey });
    }
  };

  // Handle single file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFile(file);
      setError(null);
      setFileName(file.name);
      setOriginalSize(file.size);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          validateDimensions(img.width, img.height);
          setOriginalImage(event.target.result);
          setOriginalDimensions({ width: img.width, height: img.height });
          setCompressedImage(null);
          setCompressedSize(null);
          setCompressedDimensions(null);
          setCompressedBlob(null);
          setSuccess(null);

          analyticsManager.trackEvent('image_uploaded', {
            fileName: file.name,
            size: file.size,
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => {
          setError('Failed to load image');
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        setError(ERROR_MESSAGES.PROCESSING_ERROR);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
      analyticsManager.trackError(err);
    }
  };

  // Handle batch file selection
  const handleBatchSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setError(null);
      setProcessing(true);
      setBatchMode(true);

      analyticsManager.trackEvent('batch_started', { count: files.length });

      const { results, errors } = await batchCompress(files, {
        quality,
        format: selectedFormat,
        maxWidth: resizeEnabled ? maxWidth : null,
      }, (progress) => {
        setBatchProgress(progress);
      });

      if (results.length > 0) {
        setSuccess(`Successfully compressed ${results.length} images`);
        downloadBatchResults(results);
      }

      if (errors.length > 0) {
        setError(`Failed: ${errors.length} image(s)`);
      }

      analyticsManager.trackEvent('batch_completed', {
        count: files.length,
        success: results.length,
        failed: errors.length
      });
    } catch (err) {
      setError(err.message);
      analyticsManager.trackError(err);
    } finally {
      setProcessing(false);
      setBatchMode(false);
      setBatchProgress(null);
    }
  };

  // Compress single image
  const compressImageHandler = async () => {
    if (!originalImage) return;

    try {
      setError(null);
      setProcessing(true);

      const file = new File(
        [dataURLtoBlob(originalImage)],
        fileName,
        { type: 'image/*' }
      );

      const result = await compressImage(file, {
        quality,
        format: selectedFormat,
        maxWidth: resizeEnabled ? maxWidth : null,
      });

      setCompressedBlob(result.blob);
      setCompressedSize(result.size);
      setCompressedDimensions({ width: result.width, height: result.height });

      const reader = new FileReader();
      reader.onloadend = () => {
        setCompressedImage(reader.result);
        setSuccess(`Compressed in ${result.duration}ms`);
      };
      reader.readAsDataURL(result.blob);

      await cacheManager.addToHistory({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        originalSize: result.originalSize,
        compressedSize: result.size,
        compression: result.compression,
        format: selectedFormat,
        quality,
        timestamp: Date.now()
      });

      analyticsManager.trackImageCompression(
        result.originalSize,
        result.size,
        selectedFormat,
        quality,
        result.duration
      );
    } catch (err) {
      setError(err.message);
      analyticsManager.trackError(err);
    } finally {
      setProcessing(false);
    }
  };

  // Download compressed image
  const downloadCompressed = () => {
    if (!compressedBlob) return;
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.split('.')[0]}_compressed.${selectedFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download batch results
  const downloadBatchResults = (results) => {
    if (results.length === 0) return;
    const first = results[0];
    const url = URL.createObjectURL(first.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_result_1.${selectedFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Utility to convert data URL to Blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Zap className="text-yellow-400" size={36} />
            Image Compressor Pro
          </h1>
          <p className="text-gray-400">Enterprise-grade compression with up to 80% file reduction</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded text-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded text-green-100">
            ✓ {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={20} /> Upload Image
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> Single Image
                </button>

                <input
                  type="file"
                  ref={batchInputRef}
                  onChange={handleBatchSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => batchInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> Batch (Up to 100)
                </button>
              </div>

              {originalImage && (
                <div className="bg-gray-700 rounded p-4">
                  <p className="text-sm text-gray-300 mb-2"><strong>Original:</strong> {fileName} ({formatBytes(originalSize)})</p>
                  <p className="text-sm text-gray-300">{originalDimensions?.width}x{originalDimensions?.height}px</p>
                </div>
              )}
            </div>

            {/* Settings Section */}
            {originalImage && !batchMode && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
                <h2 className="text-lg font-semibold text-white">Settings</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quality: {quality}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={resizeEnabled}
                    onChange={(e) => setResizeEnabled(e.target.checked)}
                  />
                  Resize (max width)
                </label>
                {resizeEnabled && (
                  <div>
                    <input
                      type="number"
                      value={maxWidth}
                      onChange={(e) => setMaxWidth(Number(e.target.value))}
                      min="100"
                      max="4000"
                      className="w-full bg-gray-700 text-white rounded px-3 py-2"
                      placeholder="Max width in pixels"
                    />
                  </div>
                )}

                <button
                  onClick={compressImageHandler}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded flex items-center justify-center gap-2"
                >
                  <Minimize2 size={18} /> {processing ? 'Compressing...' : 'Compress Image'}
                </button>
              </div>
            )}

            {/* Batch Progress */}
            {batchMode && batchProgress && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Processing: {batchProgress.completed}/{batchProgress.total}</h3>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(batchProgress.processed / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results Section */}
            {compressedImage && !batchMode && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Compressed Result</h2>
                <img src={compressedImage} alt="Compressed" className="w-full rounded mb-4 max-h-96 object-cover" />
                <div className="bg-gray-700 rounded p-3 mb-4 space-y-1">
                  <p className="text-sm text-green-300"><strong>Compressed:</strong> {formatBytes(compressedSize)}</p>
                  <p className="text-sm text-green-300"><strong>Reduction:</strong> {((1 - compressedSize / originalSize) * 100).toFixed(1)}%</p>
                  <p className="text-sm text-gray-300">{compressedDimensions?.width}x{compressedDimensions?.height}px</p>
                </div>
                <button
                  onClick={downloadCompressed}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Presets */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <PresetSelector onPresetSelect={applyPreset} />
            </div>

            {/* History */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <HistoryPanel />
            </div>

            {/* Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-sm">
              <h3 className="font-semibold text-white mb-3">Features</h3>
              <ul className="text-gray-300 space-y-2">
                <li>✓ 80% file reduction</li>
                <li>✓ Batch processing</li>
                <li>✓ Multiple formats</li>
                <li>✓ Custom quality</li>
                <li>✓ History tracking</li>
                <li>✓ Offline support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
