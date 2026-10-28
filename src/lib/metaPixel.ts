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
    if (typeof (window as any).fbq === 'function') {
      logDebug('PageView tracked');
      (window as any).fbq('track', 'PageView');
    } else {
      let retries = 0;
      const interval = setInterval(() => {
        retries++;
        if (typeof (window as any).fbq === 'function') {
          clearInterval(interval);
          logDebug('PageView tracked (after queue)');
          (window as any).fbq('track', 'PageView');
        } else if (retries >= 30) {
          clearInterval(interval);
        }
      }, 100);
    }
  }
};

/**
 * Trigger standard or custom events
 */
export const fbqEvent = (name: string, options?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    const track = () => {
      let testCode: string | null = null;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        testCode = urlParams.get('test_event_code') || sessionStorage.getItem('fb_test_event_code');
      } catch (e) {}

      let finalOptions = options ? { ...options } : undefined;
      if (testCode && finalOptions && !finalOptions.test_event_code) {
        finalOptions.test_event_code = testCode;
      }

      logDebug(`Event '${name}' tracked with options:`, finalOptions);
      if (finalOptions) {
        (window as any).fbq('track', name, finalOptions);
      } else {
        (window as any).fbq('track', name);
      }
    };

    if (typeof (window as any).fbq === 'function') {
      track();
    } else {
      logDebug(`Event '${name}' queued - waiting for fbq`);
      let retries = 0;
      const interval = setInterval(() => {
        retries++;
        if (typeof (window as any).fbq === 'function') {
          clearInterval(interval);
          track();
        } else if (retries >= 30) {
          clearInterval(interval);
          logDebug(`Event '${name}' timed out waiting for fbq`);
        }
      }, 100);
    }
  }
};

