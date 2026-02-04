import React, { useState, useRef, useEffect } from 'react';
import { COMPRESSION_PRESETS } from '../config/constants';

export default function PresetSelector({ onPresetSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (presetKey) => {
    onPresetSelect(presetKey);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-sm"
      >
        📋 Compression Presets
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded mt-1 shadow-lg z-10">
          {Object.entries(COMPRESSION_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className="w-full text-left px-4 py-2 hover:bg-gray-600 text-white text-sm border-b border-gray-600 last:border-b-0"
            >
              <div className="font-semibold">{preset.label}</div>
              <div className="text-gray-300 text-xs">{preset.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
