import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { fetchSubscriptionStatus } from '@/actions/subscription';
import { paths } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Pages that should NOT show the subscription overlay
const OVERLAY_EXCLUDED_PATHS = [
  paths.dashboard.general.subscription,
  paths.dashboard.general.profile,
  paths.dashboard.general.organizationSettings,
  paths.dashboard.general.settings,
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [subscriptionState, setSubscriptionState] = useState<{
    isLoading: boolean;
    isCancelled: boolean;
    hasFetched: boolean;
  }>({
    isLoading: true,
    isCancelled: false,
    hasFetched: false,
  });

  // Check if current path should be excluded from overlay
  const isExcludedPath = OVERLAY_EXCLUDED_PATHS.some(
    (excludedPath) =>
      location.pathname === excludedPath ||
      location.pathname.startsWith(excludedPath + '/')
  );

  useEffect(() => {
    if (subscriptionState.hasFetched) return;

    let isMounted = true;

    const checkSubscription = async () => {
      try {
        const activeSubscriptions = await fetchSubscriptionStatus();

        if (!isMounted) return;

        if (activeSubscriptions?.length) {
          const subscriptionData = activeSubscriptions[0];
          const sub = subscriptionData?.subscription;

          if (!sub) {
            setSubscriptionState({
              isLoading: false,
              isCancelled: true,
              hasFetched: true,
            });
            return;
          }

          const now = Math.floor(Date.now() / 1000);
          const cancelScheduled = subscriptionData.isSubscriptionCanceled;
          const cancelEffectiveAt = sub.current_period_end ?? Infinity;
          const alreadyEnded =
            sub.status === 'canceled' || Boolean(sub.ended_at);

          const isCancelled =
            alreadyEnded || (cancelScheduled && now >= cancelEffectiveAt);

          setSubscriptionState({
            isLoading: false,
            isCancelled,
            hasFetched: true,
          });
        } else {
          setSubscriptionState({
            isLoading: false,
            isCancelled: true,
            hasFetched: true,
          });
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        if (isMounted) {
          setSubscriptionState({
            isLoading: false,
            isCancelled: true,
            hasFetched: true,
          });
        }
      }
    };

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, [subscriptionState.hasFetched]);

  const showOverlay =
    subscriptionState.hasFetched &&
    subscriptionState.isCancelled &&
    !isExcludedPath;

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="relative flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto w-full px-3 sm:px-4 py-4 sm:py-6" style={{ maxWidth: '1400px' }}>
            {children}
          </div>

          {/* Subscription Overlay - only on main content, not sidebar */}
          {showOverlay && (
            <div
              className="fixed inset-0 md:left-[--sidebar-width] top-16 bg-background/80 z-40 flex flex-col items-center justify-center backdrop-blur-[2px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-4 p-6 max-w-md">
                <h2 className="text-xl font-semibold text-foreground">
                  Subscription Required
                </h2>
                <p className="text-muted-foreground">
                  Your subscription has expired or canceled. Please renew your
                  subscription to have full access.
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
