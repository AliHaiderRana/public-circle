/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateUser,
  getSubscriptionPlans,
  createPaymentIntent,
} from "@/actions/signup";
import { useAuthContext } from "@/auth/hooks/use-auth-context";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { SELECTED_PLAN, SELECTED_ADD_ONS } from "@/config/config";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Step7PlanSelectionProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
  setSelectedItems: (items: any[]) => void;
  selectedItems: any[];
  setClientSecret: (secret: string) => void;
  reward?: any;
}

export function Step7PlanSelection({
  setActiveStep,
  setSelectedItems,
  setClientSecret,
  reward,
}: Step7PlanSelectionProps) {
  const { checkUserSession } = useAuthContext();
  const existingSelectedPlan = JSON.parse(
    localStorage.getItem(SELECTED_PLAN) || "{}",
  );
  const existingSelectedAddOns = JSON.parse(
    localStorage.getItem(SELECTED_ADD_ONS) || "[]",
  );

  const [selectedPlan, setSelectedPlan] = useState<any>(
    existingSelectedPlan || null,
  );
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>(
    existingSelectedAddOns || [],
  );
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
          const allPlans = Array.isArray(response.data.data)
            ? response.data.data
            : [];
          // Filter add-ons (plans with isAddOn metadata)
          const filteredAddOns = allPlans.filter(
            (plan: any) => plan.metadata?.isAddOn === "true",
          );
          // Filter regular plans (not add-ons)
          const filteredPlans = allPlans.filter(
            (plan: any) => !plan.metadata?.isAddOn,
          );
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
            const foundPlan = sortedPlans.find(
              (p: any) => p.id === existingSelectedPlan.id,
            );
            if (foundPlan) {
              setSelectedPlan(foundPlan);
            }
          }
        } else {
          toast.error("Failed to load subscription plans");
        }
      } catch (error: any) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to load subscription plans. Please try again.");
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
    // Apply discount if available
    if (reward?.discountInPercentage > 0) {
      const discountAmount = total * (reward.discountInPercentage / 100);
      return (total - discountAmount).toFixed(2);
    }
    return total.toFixed(2);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
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
      toast.error(
        error?.response?.data?.message || "Failed to proceed to payment",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get currency symbol based on selected plan's currency
  const getCurrencySymbol = () => {
    const currency = selectedPlan?.price?.currency?.toUpperCase();
    return currency === "CAD" ? "CA$" : "$";
  };

  // Format price (unit_amount is already in dollars from backend)
  const formatPrice = (unitAmount: number) => {
    return `${getCurrencySymbol()}${unitAmount.toFixed(2)}`;
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
          <p className="text-muted-foreground mb-4">
            No subscription plans available
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Plan Selection */}
      <div className="grid gap-2">
        <Label htmlFor="plan-select">Select plan level</Label>
        <Select
          value={selectedPlan?.id || ""}
          onValueChange={handlePlanChange}
        >
          <SelectTrigger id="plan-select">
            <SelectValue placeholder="Select a plan">
              {selectedPlan && <span>{selectedPlan.name}</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan: any) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add-ons */}
      {addOns.length > 0 && (
        <div className="grid gap-3">
          <Label>Additional options</Label>
          <div className="space-y-3">
            {addOns.map((addOn: any) => {
              const isChecked = selectedAddOns.some(
                (a: any) => a.id === addOn.id,
              );
              return (
                <div key={addOn.id} className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`addon-${addOn.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleAddOnChange(addOn.id, checked as boolean)
                      }
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Label
                          htmlFor={`addon-${addOn.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {addOn.name}
                        </Label>
                        {addOn.name?.includes("Dedicated") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Get a dedicated IP to improve your email campaign performance.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {addOn.name?.includes("Dedicated") && (
                        <p className="text-xs text-muted-foreground">
                          (Request will be processed within 24 hours)
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice(addOn.price?.unit_amount || 0)}/month
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Summary Card */}
      {selectedPlan && (
        <div className="mt-2">
          <p className="text-sm text-center text-muted-foreground mb-3">Your Plan:</p>
          <div className="bg-[#D76BC2] rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold text-center mb-4">{selectedPlan.name}</h3>

            {/* Plan Features */}
            {selectedPlan.description && (
              <ul className="space-y-1.5 mb-4">
                {(Array.isArray(selectedPlan.description)
                  ? selectedPlan.description
                  : [selectedPlan.description]
                )
                  .filter((item: string) => item && item.trim())
                  .map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-white/90">
                      <span className="text-white">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            )}

            {/* Selected Add-ons in summary */}
            {selectedAddOns.length > 0 && (
              <div className="border-t border-white/20 pt-3 mb-4 space-y-2">
                {selectedAddOns.map((addOn: any) => (
                  <div key={addOn.id} className="flex items-center gap-3 text-sm text-white/90">
                    <div className="h-5 w-5 rounded bg-white/30 flex items-center justify-center">
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{addOn.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Discount Badge */}
            {reward?.discountInPercentage > 0 && (
              <div className="text-center mb-3">
                <span className="inline-block bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {reward.discountInPercentage}% discount applied
                </span>
              </div>
            )}

            {/* Price */}
            <p className="text-2xl font-bold text-center">
              ${calculateTotalCost()}/month
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={handleContinue}
        className="w-full"
        disabled={isLoading || !selectedPlan}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Next"
        )}
      </Button>
    </div>
  );
}
