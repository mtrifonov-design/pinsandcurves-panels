import { useEffect, useCallback } from 'react';

/**
 * useGoatCounter - React hook for minimal goatcounter event tracking.
 *
 * @param defaultEvent Optional event to send on mount (e.g. { path: 'some-path', event: true })
 * @returns { recordEvent } - function to record custom events
 */
export function useTracker(defaultEvent?: Record<string, any>) {
  // Send a default event on mount if provided
  useEffect(() => {
    if (defaultEvent && typeof window !== 'undefined' && window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count(defaultEvent);
    }
    if (defaultEvent
      && window.location.hostname !== 'localhost'
      && typeof window !== 'undefined'
      && window.op 
      && typeof window.op === 'function'
    ) {
      window.op('track', defaultEvent);
    }


  }, [defaultEvent]);

  // Function to record custom events
  const recordEvent = useCallback((event: Record<string, any>) => {
    // check if we are on localhost, if so, do not send events
    if (window.location.hostname === 'localhost') return;
    if (typeof window !== 'undefined' && window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count(event);
    }
    if (typeof window !== 'undefined' && window.op && typeof window.op === 'function') {
      window.op('track', event);
    }
  }, []);

  return { recordEvent };
}

export default useTracker;
