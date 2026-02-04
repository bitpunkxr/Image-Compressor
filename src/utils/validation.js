// Input validation utilities
export const validateFile = (file) => {
  if (!file) throw new Error('No file selected');
  if (file.size > 50 * 1024 * 1024) throw new Error('File too large (max 50MB)');
  if (!file.type.startsWith('image/')) throw new Error('Invalid file type');
  return true;
};

export const validateDimensions = (width, height) => {
  if (width < 10 || height < 10) throw new Error('Image too small (min 10x10px)');
  if (width > 8192 || height > 8192) throw new Error('Image too large (max 8192x8192px)');
  return true;
};

// Format bytes to human readable
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Calculate compression ratio
export const calculateCompressionRatio = (original, compressed) => {
  if (!original) return 0;
  return Math.round((1 - compressed / original) * 100);
};

// Debounce utility
export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
