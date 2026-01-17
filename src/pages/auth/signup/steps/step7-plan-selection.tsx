import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { updateUser, getSubscriptionPlans, createPaymentIntent } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';

interface Step7PlanSelectionProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
  setSelectedItems: (items: any[]) => void;
  selectedItems: any[];
  setClientSecret: (secret: string) => void;
}

export function Step7PlanSelection({
  setActiveStep,
  setSelectedItems,
  setClientSecret,
}: Step7PlanSelectionProps) {
  const { checkUserSession } = useAuthContext();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Fetch plans from API on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await getSubscriptionPlans();
        if (response?.status === 200 && response?.data?.data) {
          const allPlans = Array.isArray(response.data.data) ? response.data.data : [];
          // Filter add-ons (plans with isAddOn metadata)
          const filteredAddOns = allPlans.filter((plan: any) => plan.metadata?.isAddOn === 'true');
          // Filter regular plans (not add-ons)
          const filteredPlans = allPlans.filter((plan: any) => !plan.metadata?.isAddOn);
          // Sort plans by price (ascending)
          const sortedPlans = filteredPlans.sort((a: any, b: any) => {
            const priceA = a.price?.unit_amount || 0;
            const priceB = b.price?.unit_amount || 0;
            return priceA - priceB;
          });
          setPlans(sortedPlans);
          setAddOns(filteredAddOns);
          // Auto-select first plan if available and no plan is selected yet
          if (sortedPlans.length > 0) {
            setSelectedPlan((prev) => prev || sortedPlans[0].id);
          }
        } else {
          toast.error('Failed to load subscription plans');
        }
      } catch (error: any) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load subscription plans. Please try again.');
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setIsLoading(true);
    try {
      // Get the selected plan and add-on objects
      const selectedPlanObj = plans.find((p: any) => p.id === selectedPlan);
      const selectedAddOnObjs = selectedAddOns.map((addOnId: string) => addOns.find((a: any) => a.id === addOnId)).filter(Boolean);
      
      // Create payment intent with selected plan and add-ons
      const res = await createPaymentIntent({ 
        planId: selectedPlan,
        addOns: selectedAddOnObjs,
      });
      
      // Save selected plan and add-ons
      setSelectedItems([{ plan: selectedPlanObj, addOns: selectedAddOnObjs }]);
      
      // Set client secret if available in response
      if (res?.data?.data?.client_secret) {
        setClientSecret(res.data.data.client_secret);
      } else if (res?.data?.client_secret) {
        // Alternative response structure
        setClientSecret(res.data.client_secret);
      }
      
      await updateUser({ signUpStepsCompleted: 7 });
      await checkUserSession?.();
      setActiveStep(8);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to proceed to payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Format price from cents to dollars
  const formatPrice = (unitAmount: number) => {
    return `$${(unitAmount / 100).toFixed(2)}`;
  };

  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No subscription plans available</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => {
          const price = plan.price?.unit_amount ? formatPrice(plan.price.unit_amount) : 'N/A';
          const isSelected = selectedPlan === plan.id;
          
          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <CardTitle>{plan.name || 'Unnamed Plan'}</CardTitle>
                <div className="text-3xl font-bold">{price}</div>
                <CardDescription>
                  {plan.price?.recurring?.interval === 'month' ? '/month' : '/period'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                )}
                {plan.metadata?.features && (
                  <ul className="space-y-2">
                    {plan.metadata.features.split(',').map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {feature.trim()}
                      </li>
                    ))}
                  </ul>
                )}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground text-center">
                      Selected
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        className="w-full max-w-md mx-auto block"
        disabled={isLoading || !selectedPlan}
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </div>
  );
}
