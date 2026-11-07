/**
 * Field Core Web Vitals reporter (Addy Osmani performance-optimization skill).
 * Loads after idle and forwards LCP/INP/CLS/TTFB/FCP to GA4 when available.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function sendToAnalytics(metric: Metric) {
  const value =
    metric.name === 'CLS' ? metric.value : Math.round(metric.value);

  if (typeof window.gtag === 'function') {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value,
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: 'web_vital',
      web_vital_name: metric.name,
      web_vital_value: value,
      web_vital_rating: metric.rating,
      web_vital_id: metric.id,
    });
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

export function scheduleWebVitalsReporting() {
  if (typeof window === 'undefined') return;
  if (/Chrome-Lighthouse|Lighthouse|PageSpeed|PTST|Googlebot|AdsBot/i.test(navigator.userAgent)) {
    return;
  }

  const run = () => {
    try {
      reportWebVitals();
    } catch {
      // Never block the page on RUM failures
    }
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 2000);
  }
}
