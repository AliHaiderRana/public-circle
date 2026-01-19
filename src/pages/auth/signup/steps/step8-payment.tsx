import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { updateUser, activateCompany, attachPaymentMethod, createSubscription, requestIp } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { CheckCircle2, Check, ArrowLeft, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY || '');

interface Step8PaymentProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
  selectedItems: any[];
  reward: any;
  clientSecret: string;
}

function PaymentForm({
  selectedItems,
  reward,
  clientSecret,
  onSuccess,
}: {
  selectedItems: any[];
  reward: any;
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { checkUserSession } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = selectedItems.find((item: any) => !item?.metadata?.isAddOn);
  const selectedAddOns = selectedItems.filter((item: any) => item?.metadata?.isAddOn === 'true');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe has not loaded yet');
      return;
    }

    setIsProcessing(true);

    try {
      // Submit elements form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || 'Error submitting payment form');
        setIsProcessing(false);
        return;
      }

      // Create a payment method via Stripe Elements
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        toast.error(confirmError.message || 'Error creating payment method');
        setIsProcessing(false);
        return;
      }

      const paymentMethodId = setupIntent?.payment_method;

      if (!paymentMethodId) {
        toast.error('Payment method not found');
        setIsProcessing(false);
        return;
      }

      // Attach the payment method to the customer
      const attachRes = await attachPaymentMethod({ paymentMethodId: paymentMethodId as string });

      if (attachRes?.status === 200) {
        // Create the subscription
        const coupon = localStorage.getItem('referalCode') || '';
        const subscriptionRes = await createSubscription({
          items: [selectedPlan, ...selectedAddOns].map((item: any) => ({
            price: item?.price?.id,
          })),
          coupon: coupon || undefined,
        });

        if (subscriptionRes?.status === 200) {
          // Check if dedicated IP was selected
          const hasDedicatedItem = selectedItems.some(
            (item: any) => item?.name && item?.name?.includes('Dedicated')
          );

          if (hasDedicatedItem) {
            await requestIp({ requested: true });
          }

          // Clear referral code
          localStorage.removeItem('referalCode');

          // Refresh session
          await checkUserSession?.();

          // Update signup step
          await updateUser({ signUpStepsCompleted: 8 });

          // Activate company
          await activateCompany();

          // Refresh session again
          await checkUserSession?.();

          toast.success('Payment successful! Welcome to Public Circles.');
          onSuccess();
        } else {
          toast.error('Subscription creation failed');
        }
      } else {
        toast.error('Failed to attach payment method');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}

export function Step8Payment({
  selectedItems,
  reward,
  clientSecret,
  setActiveStep,
}: Step8PaymentProps) {
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);

  // Extract plan and add-ons from selectedItems
  // selectedItems structure: [{ plan: {...}, addOns: [...] }]
  const selectedPlan = selectedItems?.[0]?.plan;
  const selectedAddOns = selectedItems?.[0]?.addOns || [];

  // Format price from cents to dollars
  const formatPrice = (unitAmount: number) => {
    return (unitAmount / 100).toFixed(2);
  };

  // Calculate total cost
  const calculateTotal = () => {
    let total = 0;
    if (selectedPlan?.price?.unit_amount) {
      total += selectedPlan.price.unit_amount;
    }
    selectedAddOns.forEach((addOn: any) => {
      if (addOn?.price?.unit_amount) {
        total += addOn.price.unit_amount;
      }
    });
    return total;
  };

  const totalCost = calculateTotal();

  const handleSuccess = () => {
    setIsComplete(true);
    setTimeout(() => {
      navigate(paths.dashboard.analytics);
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Welcome to Public Circles!</h3>
        <p className="text-muted-foreground mb-4">
          Your account has been set up successfully.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setActiveStep(7)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your selected plan and add-ons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Plan */}
            {selectedPlan && (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{selectedPlan.name || 'Selected Plan'}</h4>
                    {selectedPlan.description && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedPlan.description}</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold">${formatPrice(selectedPlan.price?.unit_amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPlan.price?.recurring?.interval === 'month' ? '/month' : '/period'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add-ons */}
            {selectedAddOns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">Add-ons</h5>
                  {selectedAddOns.map((addOn: any, index: number) => (
                    <div key={index} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">{addOn.name || 'Add-on'}</p>
                        </div>
                        {addOn.description && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">{addOn.description}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-semibold">${formatPrice(addOn.price?.unit_amount || 0)}</p>
                        <p className="text-xs text-muted-foreground">
                          {addOn.price?.recurring?.interval === 'month' ? '/month' : '/period'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Reward/Discount */}
            {reward && (
              <>
                <Separator />
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    {reward.trialInDays > 0
                      ? `${Math.floor(reward.trialInDays / 30)} month${Math.floor(reward.trialInDays / 30) > 1 ? 's' : ''} free trial`
                      : reward.discountInPercentage > 0
                      ? `${reward.discountInPercentage}% discount applied`
                      : 'Special offer applied'}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${formatPrice(totalCost)}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {selectedPlan?.price?.recurring?.interval === 'month' ? 'Billed monthly' : 'One-time payment'}
            </p>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Review your selection and complete payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientSecret && clientSecret.trim() !== '' ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  selectedItems={selectedItems}
                  reward={reward}
                  clientSecret={clientSecret}
                  onSuccess={handleSuccess}
                />
              </Elements>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading payment form...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
