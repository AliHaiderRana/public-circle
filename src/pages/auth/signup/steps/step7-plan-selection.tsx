import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUser, getSubscriptionPlans, createPaymentIntent } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { Check, Loader2, ArrowLeft, Info } from 'lucide-react';
import { SELECTED_PLAN, SELECTED_ADD_ONS } from '@/config/config';

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
  const existingSelectedPlan = JSON.parse(localStorage.getItem(SELECTED_PLAN) || '{}');
  const existingSelectedAddOns = JSON.parse(localStorage.getItem(SELECTED_ADD_ONS) || '[]');
  
  const [selectedPlan, setSelectedPlan] = useState<any>(existingSelectedPlan || null);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>(existingSelectedAddOns || []);
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
          if (sortedPlans.length > 0 && !selectedPlan) {
            setSelectedPlan(sortedPlans[0]);
          } else if (existingSelectedPlan?.id) {
            const foundPlan = sortedPlans.find((p: any) => p.id === existingSelectedPlan.id);
            if (foundPlan) {
              setSelectedPlan(foundPlan);
            }
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

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p: any) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  const handleAddOnChange = (addOnId: string, checked: boolean) => {
    if (checked) {
      const addOn = addOns.find((a: any) => a.id === addOnId);
      if (addOn) {
        setSelectedAddOns([...selectedAddOns, addOn]);
      }
    } else {
      setSelectedAddOns(selectedAddOns.filter((a: any) => a.id !== addOnId));
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    if (selectedPlan?.price?.unit_amount) {
      total += selectedPlan.price.unit_amount;
    }
    selectedAddOns.forEach((addOn: any) => {
      if (addOn?.price?.unit_amount) {
        total += addOn.price.unit_amount;
      }
    });
    return (total / 100).toFixed(2);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setIsLoading(true);
    try {
      // Create payment intent
      const res = await createPaymentIntent();
      
      // Save selected plan and add-ons to localStorage
      localStorage.setItem(SELECTED_PLAN, JSON.stringify(selectedPlan));
      localStorage.setItem(SELECTED_ADD_ONS, JSON.stringify(selectedAddOns));
      
      // Set selected items for payment step
      setSelectedItems([selectedPlan, ...selectedAddOns]);
      
      // Set client secret if available in response
      if (res?.data?.data?.client_secret) {
        setClientSecret(res.data.data.client_secret);
      } else if (res?.data?.client_secret) {
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          localStorage.removeItem(SELECTED_PLAN);
          localStorage.removeItem(SELECTED_ADD_ONS);
          setActiveStep(6);
        }}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div>
        <h3 className="text-lg font-semibold mb-2">Choose your plan</h3>
      </div>

      <div className="space-y-2">
        <Label>Select plan level</Label>
        <Select
          value={selectedPlan?.id || ''}
          onValueChange={handlePlanChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan: any) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} - ${formatPrice(plan.price?.unit_amount || 0)}/month
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlan && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-primary">{selectedPlan.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(selectedPlan.description) ? (
                <ul className="list-disc list-inside space-y-1">
                  {selectedPlan.description.map((item: string, index: number) => (
                    <li key={index} className="text-sm">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">{selectedPlan.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {addOns.length > 0 && (
        <div className="space-y-4">
          <Label>Additional options</Label>
          <div className="space-y-3">
            {addOns.map((addOn: any) => {
              const isChecked = selectedAddOns.some((a: any) => a.id === addOn.id);
              return (
                <div key={addOn.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => handleAddOnChange(addOn.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`addon-${addOn.id}`} className="font-medium cursor-pointer">
                          {addOn.name}
                        </Label>
                        {addOn.name?.includes('Dedicated') && (
                          <div className="group relative">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover border rounded shadow-lg text-xs z-10">
                              Get a dedicated IP to improve your email campaign performance.
                            </div>
                          </div>
                        )}
                      </div>
                      {addOn.name?.includes('Dedicated') && (
                        <p className="text-xs text-muted-foreground mt-1 ml-7">
                          (Request will be processed within 24 hours)
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatPrice(addOn.price?.unit_amount || 0)}/month</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPlan && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Your Plan:</p>
              <p className="text-2xl font-bold text-primary">{selectedPlan.name}</p>
              <div className="text-3xl font-bold">${calculateTotalCost()}/month</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleContinue}
        className="w-full"
        disabled={isLoading || !selectedPlan}
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </Button>
    </div>
  );
}
