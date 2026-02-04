import React, { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ImageCompressor from './ImageCompressor';
import { analyticsManager } from './utils/analytics';

export default function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        console.log('Service Worker registration failed');
      });
    }

    // Track page load
    analyticsManager.trackEvent('app_loaded');

    // Performance monitoring
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      analyticsManager.trackMetric('page_load_time', pageLoadTime);
    });

    return () => {
      analyticsManager.destroy();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ImageCompressor />
      </div>
    </ErrorBoundary>
  );
}
