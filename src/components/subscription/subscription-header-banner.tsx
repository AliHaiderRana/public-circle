import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { fetchSubscriptionStatus } from '@/actions/subscription';
import { paths } from '@/routes/paths';
import { cn } from '@/lib/utils';

interface SubscriptionHeaderBannerProps {
  className?: string;
}

export function SubscriptionHeaderBanner({ className }: SubscriptionHeaderBannerProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bannerState, setBannerState] = useState<{
    show: boolean;
    type: 'cancelled' | 'ending' | 'scheduled' | null;
    endDate: Date | null;
    daysRemaining: number;
    scheduledPlanName?: string;
  }>({
    show: false,
    type: null,
    endDate: null,
    daysRemaining: 0,
  });

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setIsLoading(true);
    try {
      const activeSubscriptions = await fetchSubscriptionStatus();

      if (activeSubscriptions?.length) {
        const subscriptionData = activeSubscriptions[0];
        const sub = subscriptionData?.subscription;

        if (!sub) {
          setIsLoading(false);
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const cancelScheduled = subscriptionData.isSubscriptionCanceled;
        const cancelEffectiveAt = sub.current_period_end ?? Infinity;
        const alreadyEnded = sub.status === 'canceled' || Boolean(sub.ended_at);
        const isNextPlanScheduled = subscriptionData.isNextPlanScheduled;

        // Check if downgrade is scheduled
        if (isNextPlanScheduled && subscriptionData.scheduledPlans?.[0] && sub.cancel_at) {
          const scheduledPlanName = subscriptionData.scheduledPlans[0].productName;
          const scheduleDate = new Date(sub.cancel_at * 1000);
          const daysRemaining = differenceInDays(scheduleDate, new Date());
          setBannerState({
            show: true,
            type: 'scheduled',
            endDate: scheduleDate,
            daysRemaining,
            scheduledPlanName,
          });
        }
        // Check if subscription is ending/cancelled
        else if (alreadyEnded || (cancelScheduled && now >= cancelEffectiveAt)) {
          setBannerState({
            show: true,
            type: 'cancelled',
            endDate: null,
            daysRemaining: 0,
          });
        }
        // Check if cancel is scheduled but not yet effective
        else if (cancelScheduled && now < cancelEffectiveAt) {
          const endDate = new Date(cancelEffectiveAt * 1000);
          const daysRemaining = differenceInDays(endDate, new Date());
          setBannerState({
            show: true,
            type: 'ending',
            endDate,
            daysRemaining,
          });
        } else {
          setBannerState({ show: false, type: null, endDate: null, daysRemaining: 0 });
        }
      } else {
        // No subscription
        setBannerState({
          show: true,
          type: 'cancelled',
          endDate: null,
          daysRemaining: 0,
        });
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !bannerState.show) {
    return null;
  }

  const handleClick = () => {
    navigate(paths.dashboard.general.subscription);
  };

  return (
    <div
      className={cn(
        'bg-amber-50 border border-amber-200 rounded-full px-4 py-2 flex items-center gap-2',
        className
      )}
    >
      <span className="text-amber-500 flex-shrink-0">⚠️</span>
      <span className="text-sm text-amber-800">
        {bannerState.type === 'scheduled' && bannerState.endDate ? (
          <>
            Your downgrade to <strong>{bannerState.scheduledPlanName}</strong> is scheduled on{' '}
            <strong>{format(bannerState.endDate, 'MMMM d, yyyy')}</strong>. Please{' '}
            <button
              onClick={handleClick}
              className="font-semibold underline hover:no-underline"
            >
              resume the subscription
            </button>{' '}
            to keep your current plan.
          </>
        ) : bannerState.type === 'ending' && bannerState.endDate ? (
          <>
            Your subscription is set to cancel on{' '}
            <strong>{format(bannerState.endDate, 'MMMM d, yyyy')}</strong>. You have{' '}
            <strong>{bannerState.daysRemaining} days</strong> remaining. Please{' '}
            <button
              onClick={handleClick}
              className="font-semibold underline hover:no-underline"
            >
              resume the subscription
            </button>{' '}
            to have full access.
          </>
        ) : (
          <>
            Your subscription has been cancelled. Please{' '}
            <button
              onClick={handleClick}
              className="font-semibold underline hover:no-underline"
            >
              resume the subscription
            </button>{' '}
            to have full access.
          </>
        )}
      </span>
    </div>
  );
}
