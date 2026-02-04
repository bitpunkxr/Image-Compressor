// Core compression engine using Canvas API
export const compressImage = async (file, options = {}) => {
  const startTime = Date.now();
  
  try {
    const {
      quality = 80,
      format = 'jpeg',
      maxWidth = null,
    } = options;

    const dataUrl = await readFileAsDataURL(file);
    const { img, originalWidth, originalHeight } = await loadImage(dataUrl);

    let canvas = document.createElement('canvas');
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Resize if needed
    if (maxWidth && originalWidth > maxWidth) {
      const ratio = maxWidth / originalWidth;
      width = maxWidth;
      height = Math.round(originalHeight * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, format, quality);
    const duration = Date.now() - startTime;

    return {
      blob,
      size: blob.size,
      originalSize: file.size,
      width,
      height,
      originalWidth,
      originalHeight,
      compression: Math.round((1 - blob.size / file.size) * 100),
      format,
      quality,
      duration
    };
  } catch (error) {
    throw new Error(`Compression failed: ${error.message}`);
  }
};

// Batch compression with 4 concurrent limit
export const batchCompress = async (files, options = {}, onProgress = null) => {
  const results = [];
  const errors = [];
  const maxConcurrent = 4;

  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent);
    
    const batchResults = await Promise.allSettled(
      batch.map((file) => compressImage(file, options))
    );

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          file: batch[idx].name,
          error: result.reason.message
        });
      }

      if (onProgress) {
        onProgress({
          processed: results.length + errors.length,
          total: files.length,
          completed: results.length,
          failed: errors.length
        });
      }
    });
  }

  return { results, errors };
};

// Convert between formats
export const convertFormat = async (blob, toFormat, quality = 80) => {
  const dataUrl = await blobToDataURL(blob);
  const { img } = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  return await canvasToBlob(canvas, toFormat, quality);
};

// Helper: Read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Convert blob to data URL
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper: Load image from data URL
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        originalWidth: img.width,
        originalHeight: img.height
      });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Helper: Convert canvas to blob
function canvasToBlob(canvas, format, quality) {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
    canvas.toBlob(
      (blob) => resolve(blob),
      mimeType,
      quality / 100
    );
  });
}
