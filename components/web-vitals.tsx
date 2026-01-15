'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    // Track Core Web Vitals
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onINP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);

  return null;
}

function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // In production, you can send to your analytics service
  // Example for Google Analytics:
  // if (typeof window.gtag !== 'undefined') {
  //   window.gtag('event', metric.name, {
  //     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //     event_label: metric.id,
  //     non_interaction: true,
  //   });
  // }

  // Example for custom endpoint:
  // if (process.env.NODE_ENV === 'production') {
  //   navigator.sendBeacon(
  //     '/api/analytics',
  //     JSON.stringify({
  //       metric: metric.name,
  //       value: metric.value,
  //       rating: metric.rating,
  //       id: metric.id,
  //     })
  //   );
  // }
}
