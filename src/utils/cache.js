// IndexedDB cache manager with localStorage fallback
class CacheManager {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ImageCompressor', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      };
    });
  }

  async saveImage(id, imageData) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.put({ id, ...imageData, timestamp: Date.now() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addToHistory(entry) {
    try {
      if (this.db) {
        await this.saveImage(`history_${entry.id}`, entry);
      }
      // Also save to localStorage as backup
      const history = JSON.parse(localStorage.getItem('imgcomp_history') || '[]');
      history.unshift(entry);
      history.splice(100); // Keep last 100
      localStorage.setItem('imgcomp_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }

  async getHistory(limit = 50) {
    try {
      const history = JSON.parse(localStorage.getItem('imgcomp_history') || '[]');
      return history.slice(0, limit);
    } catch (e) {
      return [];
    }
  }

  async deleteImage(id) {
    if (!this.db) return;
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      store.delete(id);
      resolve();
    });
  }

  async clearHistory() {
    try {
      localStorage.removeItem('imgcomp_history');
      if (this.db) {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.clear();
      }
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }

  async clearExpiredCache() {
    // Auto-clear history older than 30 days
    try {
      const history = JSON.parse(localStorage.getItem('imgcomp_history') || '[]');
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filtered = history.filter(item => (item.timestamp || 0) > thirtyDaysAgo);
      localStorage.setItem('imgcomp_history', JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to clear expired cache:', e);
    }
  }
}

export const cacheManager = new CacheManager();
