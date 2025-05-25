import { useEffect, useCallback } from 'react';

/**
 * useGoatCounter - React hook for minimal goatcounter event tracking.
 *
 * @param defaultEvent Optional event to send on mount (e.g. { path: 'some-path', event: true })
 * @returns { recordEvent } - function to record custom events
 */
export function useGoatCounter(defaultEvent?: Record<string, any>) {
  // Send a default event on mount if provided
  useEffect(() => {
    if (defaultEvent && typeof window !== 'undefined' && window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count(defaultEvent);
    }
  }, [defaultEvent]);

  // Function to record custom events
  const recordEvent = useCallback((event: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count(event);
    }
  }, []);

  return { recordEvent };
}

export default useGoatCounter;
