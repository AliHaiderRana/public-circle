import { SubscriptionView } from '@/sections/payments/subscription-view';
import { SubscriptionStatusAlert } from '@/components/subscription-status-alert';

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      {/* Subscription Status Alert */}
      <SubscriptionStatusAlert />

      <div>
        <h1 className="text-xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription, billing, and payment methods</p>
      </div>
      <SubscriptionView />
    </div>
  );
}
