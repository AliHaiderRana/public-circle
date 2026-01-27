import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher } from '@/lib/api';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
  shouldRetryOnError: false, // Don't retry on error (like 400)
};

// ----------------------------------------------------------------------
// Types

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        product: string;
      };
    }>;
  };
}

export interface Plan {
  subscriptionId: string;
  isSubscriptionCanceled: boolean;
  productId: string;
  productName: string;
  productPrice: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  isDefaultPaymentMethod?: boolean;
}

export interface Invoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  created: number;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  line_items?: any;
}

export interface CustomerBalance {
  balance: number;
  currency: string;
  available: number;
}

export interface OverageConsumption {
  _id: string;
  kind: string;
  overage: number;
  overageCharge: number;
  description: string;
  createdAt: string;
  stripeInvoiceItemId?: string;
}

// ----------------------------------------------------------------------
// Subscription Management

export function getPlans(pageSize: number = 100) {
  const url = `/stripe/plans?pageSize=${pageSize}`;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      plans: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getActivePlans() {
  const url = '/stripe/active-plans';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      activePlans: data?.data || [],
      isLoading: isLoading && !error, // Stop loading when error occurs
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getActiveSubscription() {
  const url = '/stripe/active-subscription';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      subscription: data?.data || null,
      isLoading: isLoading && !error, // Stop loading when error occurs
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export async function createSubscription(items: Array<{ price: string }>, coupon?: string) {
  try {
    const response = await axios.post('/stripe/subscriptions', {
      items,
      coupon: coupon || '',
    });
    toast.success('Subscription created successfully');
    await mutate('/stripe/active-plans');
    await mutate('/stripe/active-subscription');
    return response;
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    toast.error(error?.response?.data?.message || 'Failed to create subscription');
    throw error;
  }
}

export async function updateSubscription(
  items: Array<{ price: string }>,
  couponCode?: string
) {
  try {
    const response = await axios.patch('/stripe/subscription', {
      items,
      couponCode: couponCode || '',
    });
    toast.success('Subscription updated successfully');
    await mutate('/stripe/active-plans');
    await mutate('/stripe/active-subscription');
    return response;
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    toast.error(error?.response?.data?.message || 'Failed to update subscription');
    throw error;
  }
}

export async function cancelSubscription() {
  try {
    const response = await axios.post('/stripe/cancel-subscription');
    toast.success('Subscription canceled successfully');
    await mutate('/stripe/active-plans');
    await mutate('/stripe/active-subscription');
    return response;
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    throw error;
  }
}

export async function resumeSubscription() {
  try {
    const response = await axios.post('/stripe/resume-subscription');
    toast.success('Subscription resumed successfully');
    await mutate('/stripe/active-plans');
    await mutate('/stripe/active-subscription');
    return response;
  } catch (error: any) {
    console.error('Error resuming subscription:', error);
    toast.error(error?.response?.data?.message || 'Failed to resume subscription');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Payment Methods

export function getPaymentMethods() {
  const url = '/stripe/payment-methods';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      paymentMethods: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getSetupIntent() {
  const url = '/stripe/setup-intent';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      setupIntent: data?.data || null,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export async function createPaymentIntent() {
  try {
    // Use setup-intent endpoint for adding payment methods
    const response = await axios.get('/stripe/setup-intent');
    return response;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function addPaymentMethod(paymentMethodId: string, setAsDefault: boolean = false) {
  try {
    const response = await axios.patch('/stripe/add-payment-method', {
      paymentMethodId,
      setAsDefault,
    });
    toast.success('Payment method added successfully');
    await mutate('/stripe/payment-methods');
    return response;
  } catch (error: any) {
    console.error('Error adding payment method:', error);
    toast.error(error?.response?.data?.message || 'Failed to add payment method');
    throw error;
  }
}

export async function deleteCard(paymentMethodId: string) {
  try {
    const response = await axios.delete(`/stripe/payment-method/${paymentMethodId}`);
    toast.success('Payment method deleted successfully');
    await mutate('/stripe/payment-methods');
    return response;
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete payment method');
    throw error;
  }
}

export async function setDefaultPaymentMethod(paymentMethodId: string) {
  try {
    const response = await axios.patch('/stripe/add-payment-method', {
      paymentMethodId,
      setAsDefault: true,
    });
    toast.success('Default payment method updated');
    await mutate('/stripe/payment-methods');
    return response;
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    toast.error(error?.response?.data?.message || 'Failed to set default payment method');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Invoices

export function getPaidInvoices(pageSize: number = 10) {
  const url = `/stripe/customer-invoices?pageSize=${pageSize}`;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoices: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getUpcomingInvoices(pageSize: number = 10) {
  const url = `/stripe/customer-invoices/upcoming?pageSize=${pageSize}`;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoices: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getReceipts(pageSize: number = 10) {
  const url = `/stripe/customer-receipts?pageSize=${pageSize}`;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      receipts: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Customer Balance & Top-Up

export function getCustomerBalance() {
  const url = '/stripe/customer-balance';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      balance: data?.data || null,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export async function createTopUp(amount: number) {
  try {
    const response = await axios.post('/stripe/top-up', { amount });
    toast.success('Top-up successful');
    await mutate('/stripe/customer-balance');
    return response;
  } catch (error: any) {
    console.error('Error creating top-up:', error);
    toast.error(error?.response?.data?.message || 'Failed to create top-up');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Quota & Usage

export function getQuotaDetails() {
  const url = '/stripe/quota-details';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      quotaDetails: data?.data || null,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Overage Consumption & Usage Details

export function getOverageConsumption() {
  // This endpoint may need to be created or may be part of another endpoint
  const url = '/overage-consumption';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      overageConsumption: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getCampaignUsageDetails() {
  const url = '/campaigns/usage-details';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      campaignUsage: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getTestEmailUsageDetails() {
  const url = '/campaigns/test-usage-detail';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      testEmailUsage: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getDefaultPaymentMethod() {
  const url = '/stripe/default-payment-method';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      paymentMethod: data?.data || null,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Customer Requests (for Dedicated IP status)

export function getCustomerRequests() {
  const url = '/company-contacts/customer-requests';

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      customerRequests: data?.data || [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}
