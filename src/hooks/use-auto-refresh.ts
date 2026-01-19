import { useEffect, useRef, useCallback } from 'react';
import { mutate } from 'swr';

interface UseAutoRefreshOptions {
  /**
   * Interval in milliseconds
   * Default: 30000 (30 seconds)
   */
  interval?: number;
  /**
   * SWR keys to refresh
   */
  keys?: string[];
  /**
   * Whether to refresh on window focus
   */
  refreshOnFocus?: boolean;
  /**
   * Whether to refresh on window reconnect
   */
  refreshOnReconnect?: boolean;
  /**
   * Whether auto-refresh is enabled
   */
  enabled?: boolean;
  /**
   * Callback function to execute on refresh
   */
  onRefresh?: () => void | Promise<void>;
}

/**
 * Hook for auto-refreshing data at intervals
 * Provides polling functionality with SWR integration
 */
export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const {
    interval = 30000,
    keys = [],
    refreshOnFocus = true,
    refreshOnReconnect = true,
    enabled = true,
    onRefresh,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current || !enabled) return;

    isRefreshingRef.current = true;

    try {
      // Refresh SWR keys
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => mutate(key)));
      }

      // Execute custom refresh callback
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error during auto-refresh:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [keys, enabled, onRefresh]);

  // Set up interval
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    intervalRef.current = setInterval(() => {
      refresh();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, refresh]);

  // Refresh on window focus
  useEffect(() => {
    if (!enabled || !refreshOnFocus) return;

    const handleFocus = () => {
      refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, refreshOnFocus, refresh]);

  // Refresh on reconnect
  useEffect(() => {
    if (!enabled || !refreshOnReconnect) return;

    const handleOnline = () => {
      refresh();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, refreshOnReconnect, refresh]);

  return {
    refresh,
    isRefreshing: isRefreshingRef.current,
  };
}
