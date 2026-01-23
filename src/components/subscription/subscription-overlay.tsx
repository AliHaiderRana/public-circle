import { useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchSubscriptionStatus } from "@/actions/subscription";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";

interface SubscriptionOverlayProps {
  children: ReactNode;
}

export function SubscriptionOverlay({ children }: SubscriptionOverlayProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubscriptionCancelled, setIsSubscriptionCancelled] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Allow access to subscription page even when cancelled
  const isSubscriptionPath =
    location.pathname === paths.dashboard.general.subscription;

  useEffect(() => {
    // Only fetch once on mount
    if (hasFetched) return;

    let isMounted = true;

    const checkStatus = async () => {
      try {
        const activeSubscriptions = await fetchSubscriptionStatus();

        if (!isMounted) {
          return;
        }

        if (activeSubscriptions?.length) {
          const sub = activeSubscriptions[0]?.subscription;
          if (!sub) {
            setHasFetched(true);
            return;
          }

          const now = Math.floor(Date.now() / 1000);
          const cancelScheduled = activeSubscriptions[0].isSubscriptionCanceled;
          const cancelEffectiveAt = sub.current_period_end ?? Infinity;
          const alreadyEnded =
            sub.status === "canceled" || Boolean(sub.ended_at);

          // Subscription is cancelled if it already ended or cancel is effective
          const showResumeOverlay =
            alreadyEnded || (cancelScheduled && now >= cancelEffectiveAt);

          setIsSubscriptionCancelled(showResumeOverlay);
        } else {
          // No active subscription found
          setIsSubscriptionCancelled(true);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        if (isMounted) {
          setIsSubscriptionCancelled(true);
        }
      } finally {
        if (isMounted) {
          setHasFetched(true);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [hasFetched]);

  return (
    <div className="relative">
      {/* Render the children */}
      {children}

      {/* Overlay when subscription is cancelled/expired */}
      {hasFetched && isSubscriptionCancelled && !isSubscriptionPath && (
        <div
          className="absolute inset-0 bg-white/80 dark:bg-background/80 z-50 flex flex-col items-center justify-center backdrop-blur-[2px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center space-y-4 p-6 max-w-md">
            <h2 className="text-xl font-semibold text-foreground">
              Subscription Required
            </h2>
            <p className="text-muted-foreground">
              Your subscription has expired or canceled. Please renew your
              subscription to have full access..
            </p>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(paths.dashboard.general.subscription);
              }}
              className="mt-4"
            >
              View Subscription
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
