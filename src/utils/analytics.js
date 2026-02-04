// Analytics and event tracking
class AnalyticsManager {
  constructor() {
    this.events = [];
    this.sessionId = Math.random().toString(36).substr(2, 9);
    this.batchInterval = null;
    this.startBatching();
  }

  trackEvent(eventName, data = {}) {
    this.events.push({
      event: eventName,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  trackImageCompression(originalSize, compressedSize, format, quality, duration) {
    this.trackEvent('image_compressed', {
      originalSize,
      compressedSize,
      ratio: Math.round((1 - compressedSize / originalSize) * 100),
      format,
      quality,
      duration
    });
  }

  trackError(error, context = {}) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...context
    });
    console.error('Analytics Error:', error);
  }

  trackMetric(metricName, value) {
    this.trackEvent('metric', {
      name: metricName,
      value
    });
  }

  trackPerformance(label, duration) {
    this.trackEvent('performance', {
      label,
      duration
    });
  }

  startBatching() {
    this.batchInterval = setInterval(() => {
      if (this.events.length > 0) {
        this.sendToAnalyticsBackend();
      }
    }, 30000); // Every 30 seconds
  }

  async sendToAnalyticsBackend() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Placeholder for actual analytics backend
      // In production, send to your analytics service
      console.log('[Analytics] Events ready:', eventsToSend.length);
    } catch (e) {
      console.error('Failed to send analytics:', e);
      this.events.push(...eventsToSend); // Re-queue on failure
    }
  }

  destroy() {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    this.sendToAnalyticsBackend();
  }
}

export const analyticsManager = new AnalyticsManager();
