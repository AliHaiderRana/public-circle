import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getActivePlans,
  getPlans,
  cancelSubscription,
  resumeSubscription,
  createSubscription,
  updateSubscription,
  getCustomerRequests,
} from '@/actions/payments';
import { verifyReferalCode } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Check, Gift, ChevronLeft, ChevronRight, Sparkles, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ----------------------------------------------------------------------
// CAROUSEL DESIGN VERSION
// ----------------------------------------------------------------------

export function SubscriptionTab() {
  const { isLoading } = getActivePlans();

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Always show the carousel view regardless of subscription status (like old project)
  return <PlanSelectionCarousel />;
}

// ----------------------------------------------------------------------
// Carousel Plan Selection Component (Unified view for both with/without subscription)
// ----------------------------------------------------------------------

function PlanSelectionCarousel() {
  const { plans, isLoading: plansLoading } = getPlans(100);
  const { activePlans } = getActivePlans();
  const { customerRequests } = getCustomerRequests();
  const { user, checkUserSession } = useAuthContext();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [openSubscribeDialog, setOpenSubscribeDialog] = useState(false);

  // Plan change dialog (upgrade/downgrade) for existing subscribers
  const [planChangeDialogOpen, setPlanChangeDialogOpen] = useState(false);
  const [planChangeResponseMessage, setPlanChangeResponseMessage] = useState<any>(null);

  // Cancel/Resume subscription state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  // Add-on confirmation dialog state
  const [addOnDialogOpen, setAddOnDialogOpen] = useState(false);
  const [pendingAddOn, setPendingAddOn] = useState<any>(null);
  const [addOnAction, setAddOnAction] = useState<'add' | 'remove'>('add');
  const [isProcessingAddOn, setIsProcessingAddOn] = useState(false);

  // Add-on referral code state
  const [addOnReferralCode, setAddOnReferralCode] = useState('');
  const [isVerifyingAddOnCode, setIsVerifyingAddOnCode] = useState(false);
  const [addOnCodeStatus, setAddOnCodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [addOnVerifiedCoupon, setAddOnVerifiedCoupon] = useState<string | null>(null);
  const [addOnRewardInfo, setAddOnRewardInfo] = useState<any>(null);

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeVerificationStatus, setCodeVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifiedCoupon, setVerifiedCoupon] = useState<string | null>(null);
  const [rewardInfo, setRewardInfo] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Saved referral code from user profile OR from active subscription discount
  const savedReferralCode = user?.referralCodeConsumed;
  const [savedRewardInfo, setSavedRewardInfo] = useState<any>(null);
  const [savedCodeFetched, setSavedCodeFetched] = useState(false);

  // Extract discount info from active subscription (if any)
  const activeSubscriptionDiscount = useMemo(() => {
    if (!activePlans?.length) return null;
    const subData = activePlans[0];
    const discount = subData?.subscription?.discount;
    if (discount?.coupon) {
      return {
        couponId: discount.coupon.id,
        couponName: discount.coupon.name,
        percentOff: discount.coupon.percent_off,
        duration: discount.coupon.duration,
        durationInMonths: discount.coupon.duration_in_months,
      };
    }
    return null;
  }, [activePlans]);

  // Fetch saved referral code info on mount OR use subscription discount
  useEffect(() => {
    if (savedCodeFetched) return;

    // If user has saved referral code, just use it without re-verifying
    // Re-verification can cause "Too many invalid attempts" errors
    if (savedReferralCode) {
      // Trust the saved code - it was already verified during signup
      setVerifiedCoupon(savedReferralCode);
      setReferralCode(savedReferralCode);
      setCodeVerificationStatus('success');
      setSavedCodeFetched(true);
      return;
    }
    // If no saved code but subscription has a discount, show it
    else if (activeSubscriptionDiscount) {
      const discountInfo = {
        discountInPercentage: activeSubscriptionDiscount.percentOff,
        type: activeSubscriptionDiscount.duration,
        durationInMonths: activeSubscriptionDiscount.durationInMonths,
      };
      setSavedRewardInfo(discountInfo);
      setRewardInfo(discountInfo);
      setCodeVerificationStatus('success');
      setSavedCodeFetched(true);
    }
  }, [savedReferralCode, savedCodeFetched, activeSubscriptionDiscount]);

  // Check if user has an active subscription
  const hasActiveSubscription = activePlans && activePlans.length > 0;
  const activeSubscription = hasActiveSubscription ? activePlans[0] : null;
  const isCanceled = activeSubscription?.isSubscriptionCanceled;

  // Check if a plan is currently subscribed
  const isPlanActive = (planId: string) => {
    return activePlans?.some((ap: any) => ap.productId === planId) || false;
  };

  // Check if an add-on is currently active in subscription
  const isAddOnActive = (addOnId: string) => {
    return activePlans?.some((ap: any) => ap.productId === addOnId) || false;
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setIsProcessingCancel(true);
    try {
      await cancelSubscription();
      setCancelDialogOpen(false);
      toast.success('Subscription canceled successfully');
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessingCancel(false);
    }
  };

  // Handle resume subscription
  const handleResumeSubscription = async () => {
    setIsProcessingCancel(true);
    try {
      await resumeSubscription();
      setResumeDialogOpen(false);
      toast.success('Subscription resumed successfully');
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessingCancel(false);
    }
  };

  // Separate plans and add-ons
  const { regularPlans, addOns } = useMemo(() => {
    if (!plans || plans.length === 0) return { regularPlans: [], addOns: [] };

    const addOnsList = plans.filter((plan: any) => plan.metadata?.isAddOn === 'true');
    const plansList = plans
      .filter((plan: any) => !plan.metadata?.isAddOn)
      .sort((a: any, b: any) => (a.price?.unit_amount || 0) - (b.price?.unit_amount || 0));

    return { regularPlans: plansList, addOns: addOnsList };
  }, [plans]);

  const maxSteps = regularPlans.length;

  // Sync selectedAddOns with active add-ons from subscription
  useEffect(() => {
    if (addOns.length > 0 && activePlans) {
      const activeAddOnsList = addOns.filter((addOn: any) => isAddOnActive(addOn.id));
      setSelectedAddOns(activeAddOnsList);
    }
  }, [addOns, activePlans]);

  // Auto-select active plan or first plan (like old project)
  useEffect(() => {
    if (regularPlans.length > 0 && !userInteracted) {
      // Find the index of the active subscribed plan
      const activeIndex = regularPlans.findIndex((plan: any) => isPlanActive(plan.id));

      if (activeIndex !== -1) {
        // Focus on the subscribed plan
        setActiveStep(activeIndex);
        setSelectedPlan(regularPlans[activeIndex]);
      } else if (!selectedPlan) {
        // No active subscription, default to first plan
        setSelectedPlan(regularPlans[0]);
        setActiveStep(0);
      }
    }
  }, [regularPlans, userInteracted, activePlans]);

  // Window resize listener for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlanSelect = (plan: any, index: number) => {
    setUserInteracted(true);
    setSelectedPlan(plan);
    setActiveStep(index);
  };

  const handleNext = () => {
    setUserInteracted(true);
    const nextStep = (activeStep + 1) % maxSteps;
    setActiveStep(nextStep);
    setSelectedPlan(regularPlans[nextStep]);
  };

  const handleBack = () => {
    setUserInteracted(true);
    const prevStep = (activeStep - 1 + maxSteps) % maxSteps;
    setActiveStep(prevStep);
    setSelectedPlan(regularPlans[prevStep]);
  };

  const handleAddOnToggle = (addOn: any, checked: boolean) => {
    // For users without subscription, toggle directly
    if (!hasActiveSubscription) {
      if (checked) {
        setSelectedAddOns([...selectedAddOns, addOn]);
      } else {
        setSelectedAddOns(selectedAddOns.filter((a: any) => a.id !== addOn.id));
      }
      return;
    }

    // For users with subscription, show confirmation dialog
    setPendingAddOn(addOn);
    setAddOnAction(checked ? 'add' : 'remove');
    setAddOnDialogOpen(true);
  };

  // Verify add-on referral code
  const handleVerifyAddOnReferralCode = async () => {
    if (!addOnReferralCode || addOnReferralCode.trim() === '') {
      toast.error('Please enter a referral code');
      return;
    }

    setIsVerifyingAddOnCode(true);
    try {
      const res = await verifyReferalCode({ referralCode: addOnReferralCode.trim() });
      if (res?.status === 200) {
        setAddOnCodeStatus('success');
        setAddOnVerifiedCoupon(addOnReferralCode.trim());
        setAddOnRewardInfo(res?.data?.data);
        toast.success(res?.data?.message || 'Referral code applied!');
      } else {
        setAddOnCodeStatus('error');
        setAddOnVerifiedCoupon(null);
        setAddOnRewardInfo(null);
      }
    } catch (error: any) {
      setAddOnCodeStatus('error');
      setAddOnVerifiedCoupon(null);
      setAddOnRewardInfo(null);
    } finally {
      setIsVerifyingAddOnCode(false);
    }
  };

  // Clear add-on referral code
  const handleClearAddOnReferralCode = () => {
    setAddOnReferralCode('');
    setAddOnCodeStatus('idle');
    setAddOnVerifiedCoupon(null);
    setAddOnRewardInfo(null);
  };

  // Handle add-on confirmation for subscribed users
  const handleConfirmAddOn = async () => {
    if (!pendingAddOn || !activeSubscription) return;

    setIsProcessingAddOn(true);
    try {
      // Find the active plan from regularPlans to get the price ID
      const activePlan = regularPlans.find((plan: any) => isPlanActive(plan.id));

      // Build new items array
      const items: { price: string }[] = [];

      // Add current plan price ID
      if (activePlan?.price?.id) {
        items.push({ price: activePlan.price.id });
      }

      // Add existing add-ons (excluding the one being toggled)
      selectedAddOns
        .filter((a: any) => a.id !== pendingAddOn.id)
        .forEach((addon: any) => {
          if (addon?.price?.id) {
            items.push({ price: addon.price.id });
          }
        });

      // If adding, include the new add-on
      if (addOnAction === 'add') {
        const newAddOnPriceId = pendingAddOn.price?.id || pendingAddOn.default_price;
        if (newAddOnPriceId) {
          items.push({ price: newAddOnPriceId });
        }
      }

      // Validate that we have at least one item
      if (items.length === 0) {
        toast.error('Unable to update subscription: No valid plan found');
        return;
      }

      // Pass coupon code if verified (only when adding)
      const couponToUse = addOnAction === 'add' ? addOnVerifiedCoupon : null;
      await updateSubscription(items, couponToUse || undefined);

      // Update local state
      if (addOnAction === 'add') {
        setSelectedAddOns([...selectedAddOns, pendingAddOn]);
        toast.success(`${pendingAddOn.name} added to your subscription`);
      } else {
        setSelectedAddOns(selectedAddOns.filter((a: any) => a.id !== pendingAddOn.id));
        toast.success(`${pendingAddOn.name} removed from your subscription`);
      }

      setAddOnDialogOpen(false);
      // Clear add-on referral code state
      handleClearAddOnReferralCode();
    } catch (error) {
      // Error handled in action
    } finally {
      setIsProcessingAddOn(false);
      setPendingAddOn(null);
    }
  };

  const handleVerifyReferralCode = async () => {
    if (!referralCode || referralCode.trim() === '') {
      toast.error('Please enter a referral code');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await verifyReferalCode({ referralCode: referralCode.trim() });
      if (res?.status === 200) {
        setCodeVerificationStatus('success');
        setVerifiedCoupon(referralCode.trim());
        setRewardInfo(res?.data?.data);
        toast.success(res?.data?.message || 'Referral code applied!');

        // Trigger confetti animation
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setCodeVerificationStatus('error');
        setVerifiedCoupon(null);
        setRewardInfo(null);
      }
    } catch (error: any) {
      setCodeVerificationStatus('error');
      setVerifiedCoupon(null);
      setRewardInfo(null);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleClearReferralCode = () => {
    setReferralCode('');
    setCodeVerificationStatus('idle');
    setVerifiedCoupon(null);
    setRewardInfo(null);
  };

  const formatPrice = (unitAmount: number) => {
    return unitAmount.toFixed(2);
  };

  const calculateSubtotal = () => {
    let total = selectedPlan?.price?.unit_amount || 0;
    selectedAddOns.forEach((addOn: any) => {
      total += addOn?.price?.unit_amount || 0;
    });
    return total;
  };

  const calculateTotal = () => {
    let total = calculateSubtotal();

    // Apply discount if verified coupon exists
    if (verifiedCoupon && rewardInfo) {
      if (rewardInfo.discountInPercentage > 0) {
        total = total - (total * rewardInfo.discountInPercentage / 100);
      } else if (rewardInfo.discounts?.percentageDiscount > 0) {
        total = total - (total * rewardInfo.discounts.percentageDiscount / 100);
      } else if (rewardInfo.discounts?.fixedDiscount > 0) {
        total = total - rewardInfo.discounts.fixedDiscount;
      }
    }

    return formatPrice(Math.max(0, total));
  };

  // Handle plan change (upgrade/downgrade) for existing subscribers
  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setIsProcessing(true);
    try {
      // Build items array with selected plan + active add-ons
      const items = [
        { price: selectedPlan.price?.id || selectedPlan.default_price },
        ...selectedAddOns.map((addOn: any) => ({
          price: addOn.price?.id || addOn.default_price,
        })),
      ];

      const res = await updateSubscription(items, verifiedCoupon || undefined);

      if (res?.status === 200) {
        setPlanChangeResponseMessage(res);
        setUserInteracted(false);
        await checkUserSession?.();
      } else {
        setPlanChangeDialogOpen(false);
        setPlanChangeResponseMessage(null);
        setVerifiedCoupon(null);
        setRewardInfo(null);
      }
    } catch (error: any) {
      // Error handled in action
      setPlanChangeDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Close plan change dialog
  const handleClosePlanChangeDialog = () => {
    setPlanChangeDialogOpen(false);
    setPlanChangeResponseMessage(null);
    // Don't clear state if it's the saved referral code
    if (verifiedCoupon !== savedReferralCode) {
      setVerifiedCoupon(null);
      setRewardInfo(null);
      setReferralCode('');
      setCodeVerificationStatus('idle');
    }
    // If it's the saved code, keep the success state
  };

  // Get the active plan from regularPlans
  const getActivePlanFromList = () => {
    return regularPlans.find((plan: any) => isPlanActive(plan.id));
  };

  // Check if selected plan is a downgrade
  const isDowngrade = () => {
    const activePlan = getActivePlanFromList();
    if (!activePlan || !selectedPlan) return false;
    return (selectedPlan.price?.unit_amount || 0) < (activePlan.price?.unit_amount || 0);
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setIsProcessing(true);
    try {
      const items = [
        { price: selectedPlan.price?.id || selectedPlan.default_price || selectedPlan.id },
        ...selectedAddOns.map((addOn: any) => ({
          price: addOn.price?.id || addOn.default_price || addOn.id,
        })),
      ];

      await createSubscription(items, verifiedCoupon || undefined);
      setOpenSubscribeDialog(false);
      setSelectedPlan(null);
      setReferralCode('');
      setCodeVerificationStatus('idle');
      setVerifiedCoupon(null);
      setRewardInfo(null);
    } catch (error: any) {
      // Error handled in action
    } finally {
      setIsProcessing(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center">
              <Skeleton className="h-80 w-96" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (regularPlans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Plans Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No subscription plans are currently available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Confetti Animation */}
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}

        {/* Cancel/Resume Subscription Link - Top Right */}
        {hasActiveSubscription && (
          <div className="flex justify-end">
            {isCanceled ? (
              <Button
                variant="link"
                className="text-primary hover:text-primary/80 p-0 h-auto"
                onClick={() => setResumeDialogOpen(true)}
              >
                Resume subscription
              </Button>
            ) : (
              <Button
                variant="link"
                className="text-muted-foreground hover:text-foreground p-0 h-auto"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel subscription
              </Button>
            )}
          </div>
        )}

        {/* 3D Carousel Plan Selection */}
        <div className="py-4">
          {/* Mobile/Tablet: Single card view with swipe */}
          <div className="block lg:hidden">
            <div className="relative">
              {regularPlans.map((plan: any, index: number) => {
                const isActive = index === activeStep;
                const price = plan.price?.unit_amount || 0;
                const planIsActive = isPlanActive(plan.id);

                if (!isActive) return null;

                return (
                  <Card
                    key={plan.id}
                    className="w-full transition-all duration-300 shadow-md rounded-lg"
                    style={{
                      backgroundColor: planIsActive ? 'hsl(var(--sidebar-primary) / 0.15)' : 'hsl(var(--muted))',
                      border: 'none',
                    }}
                  >
                    <CardContent className="p-4 relative min-h-[240px] flex flex-col">
                      {/* Active Badge or Choose Plan Button - Top Right */}
                      <div className="absolute top-3 right-3">
                        {planIsActive ? (
                          <Badge className="bg-success hover:bg-success text-success-foreground rounded-full px-3 py-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-full px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                            onClick={() => {
                              setSelectedPlan(plan);
                              // For existing subscribers, open plan change dialog
                              // For new users, open subscribe dialog
                              if (hasActiveSubscription) {
                                setPlanChangeDialogOpen(true);
                              } else {
                                setOpenSubscribeDialog(true);
                              }
                            }}
                          >
                            Choose Plan
                          </Button>
                        )}
                      </div>

                      {/* Plan Content */}
                      <div className="space-y-2 pt-6 flex-1">
                        <h3 className={cn(
                          "text-lg font-bold",
                          planIsActive ? "text-primary" : "text-foreground"
                        )}>
                          {plan.name}
                        </h3>

                        {plan.description && (
                          <div className={cn(
                            "flex-1",
                            planIsActive ? "text-foreground" : "text-muted-foreground"
                          )}>
                            <ul className="list-disc pl-4 space-y-0.5 text-xs">
                              {(Array.isArray(plan.description)
                                ? plan.description
                                : [plan.description]
                              ).slice(0, 3).map((desc: string, idx: number) => (
                                <li key={idx}>{desc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Price at Bottom */}
                      <div className="flex items-end gap-1 mt-auto pt-3">
                        <span className={cn(
                          "text-xl font-bold",
                          planIsActive ? "text-primary" : "text-foreground"
                        )}>
                          ${formatPrice(price)}
                        </span>
                        <span className={cn(
                          "text-xs mb-0.5",
                          planIsActive ? "text-muted-foreground" : "text-muted-foreground"
                        )}>
                          per month
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Mobile Navigation Buttons */}
              {regularPlans.length > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-10 h-10 shadow-md"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex gap-1">
                    {regularPlans.map((_: any, index: number) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlanSelect(regularPlans[index], index)}
                        className={cn(
                          "h-2 w-6 p-0 min-w-0 rounded-full transition-all duration-300",
                          activeStep === index
                            ? "bg-primary hover:bg-primary"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-10 h-10 shadow-md"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: 3D Carousel */}
          <div className="hidden lg:block">
            <div className="relative h-[400px] flex items-center justify-center">
              {/* Carousel Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                {regularPlans.map((plan: any, index: number) => {
                  const isActive = index === activeStep;
                  const isNext = index === (activeStep + 1) % maxSteps;
                  const isPrev = index === (activeStep - 1 + maxSteps) % maxSteps;
                  const isVisible = isActive || isNext || isPrev;

                  if (!isVisible) return null;

                  let relativePosition = 0;
                  if (isPrev) relativePosition = -1;
                  else if (isActive) relativePosition = 0;
                  else if (isNext) relativePosition = 1;

                  const price = plan.price?.unit_amount || 0;

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        "absolute w-[340px] h-[340px] transition-all duration-500 ease-out rounded-lg",
                        isActive
                          ? "z-30 scale-100 opacity-100 shadow-lg cursor-default"
                          : "z-10 scale-[0.85] opacity-50 hover:opacity-70 shadow-md cursor-pointer"
                      )}
                      style={{
                        transform: `translateX(${relativePosition * 380}px)`,
                        backgroundColor: isPlanActive(plan.id) ? 'hsl(var(--sidebar-primary) / 0.15)' : 'hsl(var(--muted))',
                        border: 'none',
                      }}
                      onClick={() => !isActive && setActiveStep(index)}
                    >
                      <CardContent className="p-6 h-full flex flex-col relative">
                        {/* Active Badge or Choose Plan Button - Top Right */}
                        <div className="absolute top-4 right-4">
                          {isPlanActive(plan.id) ? (
                            <Badge className="bg-success hover:bg-success text-success-foreground rounded-full px-3 py-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            isActive && (
                              <Button
                                size="sm"
                                className="rounded-full px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlan(plan);
                                  // For existing subscribers, open plan change dialog
                                  // For new users, open subscribe dialog
                                  if (hasActiveSubscription) {
                                    setPlanChangeDialogOpen(true);
                                  } else {
                                    setOpenSubscribeDialog(true);
                                  }
                                }}
                              >
                                Choose Plan
                              </Button>
                            )
                          )}
                        </div>

                        {/* Plan Content */}
                        <div className="space-y-4 pt-8 flex-1">
                          <h3 className={cn(
                            "text-2xl font-bold",
                            isPlanActive(plan.id) ? "text-primary" : "text-foreground"
                          )}>
                            {plan.name}
                          </h3>

                          {plan.description && (
                            <div className={cn(
                              "flex-1",
                              isPlanActive(plan.id) ? "text-foreground" : "text-muted-foreground"
                            )}>
                              <ul className="list-disc pl-5 space-y-1 text-xs">
                                {(Array.isArray(plan.description)
                                  ? plan.description
                                  : [plan.description]
                                ).slice(0, 4).map((desc: string, idx: number) => (
                                  <li key={idx}>{desc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Price at Bottom */}
                        <div className="flex items-end gap-2 mt-auto">
                          <span className={cn(
                            "text-2xl font-bold",
                            isPlanActive(plan.id) ? "text-primary" : "text-foreground"
                          )}>
                            ${formatPrice(price)}
                          </span>
                          <span className={cn(
                            "text-sm mb-0.5",
                            isPlanActive(plan.id) ? "text-muted-foreground" : "text-muted-foreground"
                          )}>
                            per month
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              {regularPlans.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-40 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-40 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1 mt-4">
              {regularPlans.map((_: any, index: number) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlanSelect(regularPlans[index], index)}
                  className={cn(
                    "h-2 w-6 p-0 min-w-0 rounded-full transition-all duration-300",
                    activeStep === index
                      ? "bg-primary hover:bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

      {/* Add-ons Section */}
      {addOns.length > 0 && (
        <div className="space-y-3 mt-6">
          <h2 className="text-xl font-bold">Add-ons</h2>
          <Card className="rounded-lg">
            <CardContent className="p-4">
              <div className="space-y-1">
                {addOns.map((addOn: any, index: number) => {
                  const isChecked = selectedAddOns.some((a: any) => a.id === addOn.id);
                  const isDedicatedIP = addOn.name?.toLowerCase().includes('dedicated');
                  const isRemoveReference = addOn.name?.toLowerCase().includes('remove') ||
                                            addOn.name?.toLowerCase().includes('reference');
                  // Check if Dedicated IP request is pending
                  const isDedicatedIPPending = isDedicatedIP &&
                    customerRequests?.length > 0 &&
                    customerRequests[0]?.requestStatus === 'PENDING';

                  return (
                    <div key={addOn.id}>
                      <div className="flex items-center justify-between py-2 px-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{addOn.name}</h3>
                            {(isDedicatedIP || isRemoveReference) && (
                              <div className="group relative">
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-popover border rounded shadow-lg text-xs z-10">
                                  {isDedicatedIP
                                    ? 'Get a dedicated IP address to improve your email deliverability and sender reputation.'
                                    : 'Remove the "Powered by Public Circles" branding from your emails.'}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {addOn.description || (isDedicatedIP
                              ? 'Request will be processed within 24 hours'
                              : 'No description available')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            ${formatPrice(addOn.price?.unit_amount || 0)}/mo
                          </span>
                          <Switch
                            checked={isChecked}
                            onCheckedChange={(checked) => handleAddOnToggle(addOn, checked)}
                            disabled={isDedicatedIPPending}
                            className="data-[state=checked]:bg-primary scale-90"
                          />
                        </div>
                      </div>
                      {/* Show pending request info for Dedicated IP */}
                      {isDedicatedIPPending && (
                        <div className="flex items-center gap-2 px-1 pb-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Your request is forwarded and will be processed in 24hrs.
                          </p>
                        </div>
                      )}
                      {index < addOns.length - 1 && (
                        <Separator className="border-dashed my-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Confirmation Dialog */}
      <Dialog open={openSubscribeDialog} onOpenChange={setOpenSubscribeDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Complete Your Subscription
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review your selection and apply a referral code for discounts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {/* Selected Plan Summary */}
            {selectedPlan && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Selected Plan</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{selectedPlan.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {Array.isArray(selectedPlan.description)
                          ? selectedPlan.description[0]
                          : selectedPlan.description}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                        ${formatPrice(selectedPlan.price?.unit_amount || 0)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">/month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-ons Summary */}
            {selectedAddOns.length > 0 && (
              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">Selected Add-ons</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {selectedAddOns.map((addOn: any) => (
                      <div key={addOn.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <p className="text-xs sm:text-sm font-medium truncate">{addOn.name}</p>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold flex-shrink-0">
                          ${formatPrice(addOn.price?.unit_amount || 0)}/mo
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saved Referral Code / Active Discount Banner - shows when saved code or subscription discount exists but not yet applied via form */}
            {(savedReferralCode || activeSubscriptionDiscount) && !verifiedCoupon && (
              <div className="p-4 bg-muted border rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-success">
                        {savedReferralCode ? 'Referral code applied:' : 'Discount applied:'}
                      </span>
                      <Badge className="bg-foreground text-background">
                        {savedReferralCode || activeSubscriptionDiscount?.couponName || 'Active Discount'}
                      </Badge>
                    </div>
                    {(savedRewardInfo || activeSubscriptionDiscount) && (
                      <p className="text-sm text-muted-foreground">
                        {(savedRewardInfo?.type === 'forever' || activeSubscriptionDiscount?.duration === 'forever')
                          ? `You have ${savedRewardInfo?.discountInPercentage || activeSubscriptionDiscount?.percentOff}% discount`
                          : `You have ${savedRewardInfo?.discountInPercentage || activeSubscriptionDiscount?.percentOff}% discount for ${savedRewardInfo?.durationInMonths || activeSubscriptionDiscount?.durationInMonths}${(savedRewardInfo?.durationInMonths || activeSubscriptionDiscount?.durationInMonths) > 1 ? ' months' : ' month'}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Referral Code Section */}
            <Card className="overflow-hidden border-2 border-dashed border-primary/30">
              <CardContent className="p-0">
                {codeVerificationStatus === 'success' && (
                  <div className="bg-primary/5 border-b border-primary/20 p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                            Referral Code Applied!
                            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-pulse" />
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                            {rewardInfo?.discountInPercentage
                              ? `${rewardInfo.discountInPercentage}% discount `
                              : rewardInfo?.trialInDays
                                ? `${Math.floor(rewardInfo.trialInDays / 30)} month free trial `
                                : 'Discount '}
                            will be applied
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary text-primary-foreground w-fit text-xs">
                        <Gift className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                        {referralCode}
                      </Badge>
                    </div>
                  </div>
                )}

                <Accordion type="single" collapsible defaultValue="referral-code" className="w-full">
                  <AccordionItem value="referral-code" className="border-none">
                    <AccordionTrigger className="px-3 sm:px-6 py-3 sm:py-5 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-300 group">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                          codeVerificationStatus === 'success'
                            ? "bg-primary/10 ring-2 ring-primary/20"
                            : "bg-primary/10"
                        )}>
                          <Gift className={cn(
                            "h-5 w-5 sm:h-6 sm:w-6",
                            codeVerificationStatus === 'success' ? "text-primary" : "text-primary"
                          )} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-bold text-sm sm:text-base">
                            {codeVerificationStatus === 'success'
                              ? 'Referral Code Applied'
                              : 'Have a Referral Code?'}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Get special discounts and rewards
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] sm:text-xs hidden sm:flex">
                          Optional
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                      <div className="space-y-3 sm:space-y-4 pt-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Enter referral code"
                              value={referralCode}
                              onChange={(e) => {
                                setReferralCode(e.target.value);
                                if (codeVerificationStatus !== 'idle') {
                                  setCodeVerificationStatus('idle');
                                  setVerifiedCoupon(null);
                                  setRewardInfo(null);
                                }
                              }}
                              disabled={isVerifyingCode}
                              className="h-10 sm:h-11 text-sm"
                            />
                            {codeVerificationStatus === 'success' && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                            )}
                            {codeVerificationStatus === 'error' && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                            )}
                          </div>
                          {codeVerificationStatus === 'success' ? (
                            <Button variant="outline" onClick={handleClearReferralCode} className="h-10 sm:h-11 text-xs sm:text-sm">
                              <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              onClick={handleVerifyReferralCode}
                              disabled={isVerifyingCode || !referralCode.trim()}
                              className="h-10 sm:h-11 text-xs sm:text-sm"
                            >
                              {isVerifyingCode ? (
                                <>
                                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                  Apply
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {codeVerificationStatus === 'error' && (
                          <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                            <AlertDescription className="text-xs sm:text-sm text-red-700">
                              Invalid referral code. Please check and try again.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <Card className="border-2 border-primary">
              <CardContent className="p-3 sm:p-4 md:pt-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-sm sm:text-lg font-semibold">Total</span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                    ${calculateTotal()}/mo
                  </span>
                </div>
                {verifiedCoupon && rewardInfo && (
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs sm:text-sm font-medium text-primary">
                      {rewardInfo.discountInPercentage > 0
                        ? `${rewardInfo.discountInPercentage}% discount applied!`
                        : 'Special offer applied!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setOpenSubscribeDialog(false);
                setSelectedPlan(null);
              }}
              disabled={isProcessing}
              className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubscribe}
              disabled={isProcessing}
              className="w-full sm:w-auto sm:min-w-[150px] text-xs sm:text-sm h-9 sm:h-10"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Subscribe Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Your access will end at the end
              of your billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isProcessingCancel}
            >
              No, Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isProcessingCancel}
            >
              {isProcessingCancel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Subscription Dialog */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to resume your subscription and regain full access?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setResumeDialogOpen(false)}
              disabled={isProcessingCancel}
            >
              No, Keep Cancelled
            </Button>
            <Button
              onClick={handleResumeSubscription}
              disabled={isProcessingCancel}
            >
              {isProcessingCancel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Resume Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Change Dialog (Upgrade/Downgrade) */}
      <Dialog open={planChangeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleClosePlanChangeDialog();
        } else {
          setPlanChangeDialogOpen(open);
        }
      }}>
        <DialogContent className="max-w-md">
          {planChangeResponseMessage ? (
            <>
              <DialogHeader>
                <DialogTitle>Update Subscription</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-6">
                {planChangeResponseMessage.status === 200 ? (
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-12 w-12 text-success" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                )}
                <p className={cn(
                  "text-lg font-bold text-center",
                  planChangeResponseMessage.status === 200 ? "text-success" : "text-destructive"
                )}>
                  {planChangeResponseMessage?.data?.message || 'Subscription updated successfully'}
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleClosePlanChangeDialog}>
                  Acknowledge
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Update Subscription</DialogTitle>
                <DialogDescription>
                  {isDowngrade() ? (
                    <>Your downgrade request for <strong>{selectedPlan?.name}</strong> Plan will be scheduled.</>
                  ) : (
                    <>Are you sure you want to subscribe to the <strong>{selectedPlan?.name}</strong>?</>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* Saved Referral Code / Active Discount Banner */}
              {(savedReferralCode || activeSubscriptionDiscount) && (
                <div className="p-4 bg-muted border rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-success">
                          {savedReferralCode ? 'Referral code applied:' : 'Discount applied:'}
                        </span>
                        <Badge className="bg-foreground text-background">
                          {savedReferralCode || activeSubscriptionDiscount?.couponName || 'Active Discount'}
                        </Badge>
                      </div>
                      {(savedRewardInfo || activeSubscriptionDiscount) && (
                        <p className="text-sm text-muted-foreground">
                          {(savedRewardInfo?.type === 'forever' || activeSubscriptionDiscount?.duration === 'forever')
                            ? `You have ${savedRewardInfo?.discountInPercentage || activeSubscriptionDiscount?.percentOff}% discount`
                            : `You have ${savedRewardInfo?.discountInPercentage || activeSubscriptionDiscount?.percentOff}% discount for ${savedRewardInfo?.durationInMonths || activeSubscriptionDiscount?.durationInMonths}${(savedRewardInfo?.durationInMonths || activeSubscriptionDiscount?.durationInMonths) > 1 ? ' months' : ' month'}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Code Input Section */}
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="referral-code" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">Have a referral code?</p>
                        <p className="text-xs text-muted-foreground">Enter it to unlock exclusive rewards</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {codeVerificationStatus === 'success' ? (
                        <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-sm text-success font-medium">
                              Code applied: {verifiedCoupon}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearReferralCode}
                            className="h-7 px-2"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Enter referral code"
                              value={referralCode}
                              onChange={(e) => {
                                setReferralCode(e.target.value);
                                if (codeVerificationStatus !== 'idle') {
                                  setCodeVerificationStatus('idle');
                                }
                              }}
                              disabled={isVerifyingCode}
                              className={cn(
                                codeVerificationStatus === 'error' && 'border-destructive'
                              )}
                            />
                            {codeVerificationStatus === 'error' && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                                <XCircle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={handleVerifyReferralCode}
                            disabled={isVerifyingCode || !referralCode.trim()}
                            size="sm"
                          >
                            {isVerifyingCode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </div>
                      )}

                      {codeVerificationStatus === 'error' && (
                        <p className="text-xs text-destructive">
                          Invalid referral code. Please check and try again.
                        </p>
                      )}

                      {rewardInfo && (
                        <p className="text-xs text-muted-foreground">
                          {rewardInfo?.discountInPercentage
                            ? `${rewardInfo.discountInPercentage}% discount will be applied`
                            : rewardInfo?.trialInDays
                              ? `${Math.floor(rewardInfo.trialInDays / 30)} month free trial will be applied`
                              : 'Discount will be applied'}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={handleClosePlanChangeDialog}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPlanChange}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Subscription'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add-on Confirmation Dialog */}
      <Dialog open={addOnDialogOpen} onOpenChange={(open) => {
        setAddOnDialogOpen(open);
        if (!open) {
          handleClearAddOnReferralCode();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addOnAction === 'add' ? 'Add' : 'Remove'} {pendingAddOn?.name}
            </DialogTitle>
            <DialogDescription>
              {addOnAction === 'add' ? (
                <>
                  You are about to add <strong>{pendingAddOn?.name}</strong> to your subscription.
                  <br /><br />
                  <span className="text-foreground font-medium">
                    Additional cost: ${formatPrice(pendingAddOn?.price?.unit_amount || 0)}/month
                  </span>
                  <br /><br />
                  This will be prorated and added to your next billing cycle.
                </>
              ) : (
                <>
                  You are about to remove <strong>{pendingAddOn?.name}</strong> from your subscription.
                  <br /><br />
                  The change will take effect at the end of your current billing period.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Referral Code Section - Only show when adding */}
          {addOnAction === 'add' && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Have a referral code?</span>
              </div>

              {addOnCodeStatus === 'success' ? (
                <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">
                      Code applied: {addOnVerifiedCoupon}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAddOnReferralCode}
                    className="h-7 px-2"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter referral code"
                      value={addOnReferralCode}
                      onChange={(e) => {
                        setAddOnReferralCode(e.target.value);
                        if (addOnCodeStatus !== 'idle') {
                          setAddOnCodeStatus('idle');
                        }
                      }}
                      disabled={isVerifyingAddOnCode}
                      className={cn(
                        addOnCodeStatus === 'error' && 'border-destructive'
                      )}
                    />
                    {addOnCodeStatus === 'error' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                        <XCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleVerifyAddOnReferralCode}
                    disabled={isVerifyingAddOnCode || !addOnReferralCode.trim()}
                    size="sm"
                  >
                    {isVerifyingAddOnCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              )}

              {addOnCodeStatus === 'error' && (
                <p className="text-xs text-destructive">
                  Invalid referral code. Please check and try again.
                </p>
              )}

              {addOnRewardInfo && (
                <p className="text-xs text-muted-foreground">
                  {addOnRewardInfo?.discountInPercentage
                    ? `${addOnRewardInfo.discountInPercentage}% discount will be applied`
                    : addOnRewardInfo?.trialInDays
                      ? `${Math.floor(addOnRewardInfo.trialInDays / 30)} month free trial will be applied`
                      : 'Discount will be applied'}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setAddOnDialogOpen(false);
                setPendingAddOn(null);
                handleClearAddOnReferralCode();
              }}
              disabled={isProcessingAddOn}
            >
              Cancel
            </Button>
            <Button
              variant={addOnAction === 'remove' ? 'destructive' : 'default'}
              onClick={handleConfirmAddOn}
              disabled={isProcessingAddOn}
            >
              {isProcessingAddOn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Yes, ${addOnAction === 'add' ? 'Add' : 'Remove'} Add-on`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </TooltipProvider>
  );
}
