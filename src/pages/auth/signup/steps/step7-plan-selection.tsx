import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface Step7PlanSelectionProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
  setSelectedItems: (items: any[]) => void;
  selectedItems: any[];
  setClientSecret: (secret: string) => void;
}

// Mock plans - replace with actual API call
const PLANS = [
  { id: 'plan1', name: 'Starter', price: '$29', features: ['Feature 1', 'Feature 2'] },
  { id: 'plan2', name: 'Professional', price: '$99', features: ['All Starter', 'Feature 3', 'Feature 4'], popular: true },
  { id: 'plan3', name: 'Enterprise', price: '$299', features: ['All Professional', 'Feature 5', 'Feature 6'] },
];

export function Step7PlanSelection({
  setActiveStep,
  setSelectedItems,
  setClientSecret,
}: Step7PlanSelectionProps) {
  const { checkUserSession } = useAuthContext();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setIsLoading(true);
    try {
      // Save selected plan and add-ons
      setSelectedItems([{ plan: selectedPlan, addOns: selectedAddOns }]);
      
      // Create payment intent (would call actual API)
      // const res = await createPaymentIntent({ planId: selectedPlan, addOns: selectedAddOns });
      // setClientSecret(res?.data?.clientSecret);
      
      await updateUser({ signUpStepsCompleted: 7 });
      await checkUserSession?.();
      setActiveStep(8);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to proceed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            } ${plan.popular ? 'border-primary' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold">{plan.price}</div>
              <CardDescription>/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              {selectedPlan === plan.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground text-center">
                    Selected
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
