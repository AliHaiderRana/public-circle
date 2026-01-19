import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoRefreshIndicatorProps {
  /**
   * Last refresh timestamp
   */
  lastRefresh?: Date | null;
  /**
   * Whether refresh is in progress
   */
  isRefreshing?: boolean;
  /**
   * Refresh interval in seconds
   */
  interval?: number;
  /**
   * Show countdown
   */
  showCountdown?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Component to display auto-refresh status and countdown
 */
export function AutoRefreshIndicator({
  lastRefresh,
  isRefreshing = false,
  interval = 30,
  showCountdown = true,
  className,
}: AutoRefreshIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(interval);

  useEffect(() => {
    if (!showCountdown || !lastRefresh) {
      setTimeRemaining(interval);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
      const remaining = Math.max(0, interval - elapsed);
      setTimeRemaining(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [lastRefresh, interval, showCountdown]);

  if (!lastRefresh && !isRefreshing) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1.5 text-xs font-normal',
        isRefreshing && 'animate-pulse',
        className
      )}
    >
      <RefreshCw
        className={cn('h-3 w-3', isRefreshing && 'animate-spin')}
      />
      {isRefreshing ? (
        <span>Refreshing...</span>
      ) : showCountdown ? (
        <span>Refreshes in {timeRemaining}s</span>
      ) : (
        <span>Auto-refresh enabled</span>
      )}
    </Badge>
  );
}
