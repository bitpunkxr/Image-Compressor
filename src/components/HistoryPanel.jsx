import React, { useState, useEffect } from 'react';
import { Trash2, Trash } from 'lucide-react';
import { cacheManager } from '../utils/cache';
import { formatBytes } from '../utils/validation';

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const items = await cacheManager.getHistory(20);
    setHistory(items || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await cacheManager.deleteImage(id);
    loadHistory();
  };

  const handleClearAll = async () => {
    if (confirm('Clear all history?')) {
      await cacheManager.clearHistory();
      loadHistory();
    }
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm">No compression history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-300">History (Last 20)</h3>
        <button
          onClick={handleClearAll}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
        >
          <Trash size={14} /> Clear
        </button>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {history.map((item) => (
          <div key={item.id} className="bg-gray-700 rounded p-2 flex justify-between items-center text-xs hover:bg-gray-600">
            <div className="flex-1">
              <p className="text-gray-200 truncate">{item.fileName}</p>
              <p className="text-gray-400">{item.compression}% reduction</p>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-gray-400 hover:text-red-400 ml-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
