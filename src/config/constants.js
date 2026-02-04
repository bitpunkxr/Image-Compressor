// Compression presets
export const COMPRESSION_PRESETS = {
  maximum: {
    label: '📦 Maximum Compression',
    description: 'Best file size (80% reduction)',
    quality: 60,
    formats: ['jpeg', 'webp']
  },
  high: {
    label: '⚡ High Compression',
    description: 'Good balance (60% reduction)',
    quality: 75,
    formats: ['jpeg', 'webp', 'png']
  },
  balanced: {
    label: '⚖️ Balanced',
    description: 'Best quality/size ratio',
    quality: 85,
    formats: ['jpeg', 'webp', 'png']
  },
  high_quality: {
    label: '✨ High Quality',
    description: 'Minimal loss (30% reduction)',
    quality: 90,
    formats: ['png', 'webp']
  },
  lossless: {
    label: '🎨 Lossless',
    description: 'No quality loss',
    quality: 100,
    formats: ['png', 'webp']
  }
};

// Supported formats
export const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'bmp'];

// Limits and constraints
export const LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DIMENSION: 8192,
  MIN_DIMENSION: 10,
  MAX_BATCH_SIZE: 100,
  MAX_CONCURRENT_PROCESSING: 4
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File exceeds 50MB limit',
  INVALID_FORMAT: 'Only image files are supported',
  INVALID_DIMENSIONS: 'Image dimensions must be between 10x10 and 8192x8192 pixels',
  PROCESSING_ERROR: 'Failed to compress image. Please try again.',
  NO_FILE: 'Please select an image file'
};

// Cache configuration
export const CACHE_CONFIG = {
  MAX_HISTORY_ITEMS: 100,
  HISTORY_EXPIRY_DAYS: 30,
  HISTORY_KEY: 'imgcomp_history'
};
