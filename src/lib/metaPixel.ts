export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1661359738962623';

// Log helper for debugging in development
const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta Pixel]', ...args);
  }
};

/**
 * Trigger pageview event explicitly
 */
export const fbqPageView = () => {
  if (typeof window !== 'undefined') {
    if ((window as any).fbq) {
      logDebug('PageView tracked');
      (window as any).fbq('track', 'PageView');
    } else {
      logDebug('PageView skipped - fbq not loaded');
    }
  }
};

/**
 * Trigger standard or custom events
 */
export const fbqEvent = (name: string, options?: object) => {
  if (typeof window !== 'undefined') {
    if ((window as any).fbq) {
      logDebug(`Event '${name}' tracked with options:`, options);
      if (options) {
        (window as any).fbq('track', name, options);
      } else {
        (window as any).fbq('track', name);
      }
    } else {
      logDebug(`Event '${name}' skipped - fbq not loaded or Pixel ID missing`, options);
    }
  }
};
