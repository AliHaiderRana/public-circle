import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { updateUser, activateCompany } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { CheckCircle2, Check } from 'lucide-react';

interface Step8PaymentProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
  selectedItems: any[];
  reward: any;
  clientSecret: string;
}

export function Step8Payment({
  selectedItems,
  reward,
}: Step8PaymentProps) {
  const { checkUserSession } = useAuthContext();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    try {
      // Here you would integrate with Stripe Elements
      // For now, just simulate success
      
      // Update signup step completion
      await updateUser({ signUpStepsCompleted: 8 });
      
      // Activate the company after successful payment
      await activateCompany();
      
      // Refresh user session to get updated company status
      await checkUserSession?.();
      
      setIsComplete(true);
      toast.success('Payment successful! Welcome to Public Circles.');
      
      setTimeout(() => {
        navigate(paths.dashboard.analytics);
      }, 2000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.errorMessage || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
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
    <div className="space-y-6 max-w-2xl mx-auto">
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
            {/* Payment form would go here - Stripe Elements integration */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Payment processing integration with Stripe Elements would go here.
              </p>
            </div>

            <Button
              onClick={handleCompletePayment}
              className="w-full"
              disabled={isProcessing || !selectedPlan}
              size="lg"
            >
              {isProcessing ? 'Processing Payment...' : 'Complete Payment'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
