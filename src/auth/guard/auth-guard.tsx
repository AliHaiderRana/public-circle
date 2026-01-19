import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CONFIG } from '@/config/config';
import { paths } from '@/routes/paths';
import { useAuthContext } from '../hooks/use-auth-context';
import { getSubscriptionStatus } from '@/actions/subscription';
import { SubscriptionOverlay } from '@/components/subscription-overlay';

// ----------------------------------------------------------------------

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, loading } = useAuthContext();
  const [hasChecked, setHasChecked] = useState(false);
  const { subscriptionStatus, isLoading: subscriptionLoading } = getSubscriptionStatus();

  // Check if subscription is cancelled
  // subscriptionStatus is an array of plans, each with a subscription object
  const subscriptionData = Array.isArray(subscriptionStatus) && subscriptionStatus.length > 0 
    ? subscriptionStatus[0]
    : null;
  
  const subscription = subscriptionData?.subscription || null;
  const isSubscriptionCanceled = subscriptionData?.isSubscriptionCanceled || false;
  
  // Check if subscription status is cancelled or inactive
  const isSubscriptionCancelled = 
    !subscription || 
    subscription?.status === 'canceled' || 
    subscription?.status === 'inactive' ||
    subscription?.cancel_at_period_end ||
    isSubscriptionCanceled;
  
  const isSubscriptionPage = location.pathname === paths.dashboard.general.subscription;

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // Once loading is complete, check if user is authenticated
    if (!authenticated) {
      const { method } = CONFIG.auth;

      const signInPath = {
        jwt: paths.auth.jwt.signIn,
      }[method];

      const returnTo = location.pathname;
      const href = `${signInPath}?returnTo=${encodeURIComponent(returnTo)}`;

      navigate(href, { replace: true });
      return;
    }

    // User is authenticated, allow access
    setHasChecked(true);
  }, [authenticated, loading, navigate, location.pathname]);

  // Handle subscription cancellation - redirect to subscription page if not already there
  useEffect(() => {
    if (!loading && authenticated && hasChecked && !subscriptionLoading) {
      if (isSubscriptionCancelled && !isSubscriptionPage) {
        navigate(paths.dashboard.general.subscription, { replace: true });
      }
    }
  }, [isSubscriptionCancelled, isSubscriptionPage, loading, authenticated, hasChecked, subscriptionLoading, navigate]);

  // Show loading while auth is being checked
  if (loading || (!authenticated && !hasChecked) || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!authenticated) {
    return null;
  }

  // If subscription is cancelled, show overlay and block access (except subscription page)
  if (isSubscriptionCancelled && !isSubscriptionPage) {
    return (
      <>
        <SubscriptionOverlay 
          open={true}
          subscription={subscription || undefined}
          isSubscriptionCanceled={isSubscriptionCanceled}
        />
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
      </>
    );
  }

  // User is authenticated and subscription is active, show the protected page
  return <>{children}</>;
}
