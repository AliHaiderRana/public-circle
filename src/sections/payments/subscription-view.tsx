import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mutate } from 'swr';
import { SubscriptionTab } from './view/subscription-tab';
import { OverageTab } from './view/overage-tab';
import { InvoicesTab } from './view/invoices-tab';
import { PaymentMethodsTab } from './view/payment-methods-tab';

// ----------------------------------------------------------------------

export function SubscriptionView() {
  const location = useLocation();
  const { isTopUp } = (location.state as { isTopUp?: boolean }) || {};
  const [activeTab, setActiveTab] = useState(isTopUp ? 'overage' : 'subscriptions');

  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    
    // Refresh data when switching to overage tab
    if (value === 'overage') {
      try {
        await mutate('/stripe/customer-balance');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="overage">Overage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionTab />
        </TabsContent>

        <TabsContent value="overage" className="mt-6">
          <OverageTab />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesTab />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
