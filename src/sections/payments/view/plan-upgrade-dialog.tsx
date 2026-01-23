import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingButton } from '@/components/ui/loading-button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getPlans, getActivePlans, updateSubscription } from '@/actions/payments';
import { verifyReferalCode } from '@/actions/signup';
import { toast } from 'sonner';
import { Check, ArrowUp, ArrowDown, Loader2, Gift, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------

interface Plan {
  id: string;
  name: string;
  price: {
    id?: string;
    unit_amount: number;
    currency: string;
    proratedAmount?: number;
  };
  description?: string | string[];
  isActivePlan?: boolean;
  quota?: {
    email: number;
    bandwidth: number;
    contact: number;
  };
  productId?: string;
}

interface PlanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanUpgradeDialog({ open, onOpenChange }: PlanUpgradeDialogProps) {
  const { plans, isLoading: plansLoading } = getPlans(100);
  const { activePlans } = getActivePlans();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeVerificationStatus, setCodeVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifiedCoupon, setVerifiedCoupon] = useState<string | null>(null);
  const [rewardInfo, setRewardInfo] = useState<any>(null);

  const activePlanId = useMemo(() => {
    return activePlans?.[0]?.productId || null;
  }, [activePlans]);

  // Find the price ID for the selected plan
  // The API returns plans with price objects that contain the price ID
  const getPriceId = (plan: any): string => {
    // Plans from API have price.id which is the Stripe price ID
    if (plan.price?.id) {
      return plan.price.id;
    }
    // If price.id doesn't exist, try to find it in the plan structure
    // Some plans might have the price ID directly
    if (plan.default_price) {
      return plan.default_price;
    }
    // Last resort: use plan.id (though this should be product ID, not price ID)
    console.warn('Price ID not found for plan:', plan);
    return plan.id;
  };

  const sortedPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    return [...plans].sort((a, b) => {
      const priceA = a.price?.unit_amount || 0;
      const priceB = b.price?.unit_amount || 0;
      return priceA - priceB;
    });
  }, [plans]);

  const handlePlanSelect = (plan: Plan) => {
    if (plan.isActivePlan) return;
    setSelectedPlan(plan);
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

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      // Get the price ID for the selected plan
      const priceId = getPriceId(selectedPlan);

      // Prepare subscription data with referral code if verified
      const subscriptionData: any = [{ price: priceId }];

      // Note: The updateSubscription API might need to be modified to accept coupon/referral code
      // For now, we're passing the verified coupon if available
      await updateSubscription(subscriptionData, verifiedCoupon || undefined);

      toast.success('Subscription updated successfully');
      onOpenChange(false);
      setSelectedPlan(null);

      // Reset referral code state
      handleClearReferralCode();
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

  const isUpgrade = useMemo(() => {
    if (!selectedPlan || !activePlanId) return false;
    const activePlan = sortedPlans.find((p) => p.id === activePlanId);
    if (!activePlan) return false;
    return (selectedPlan.price?.unit_amount || 0) > (activePlan.price?.unit_amount || 0);
  }, [selectedPlan, activePlanId, sortedPlans]);

  if (plansLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade or Downgrade Plan</DialogTitle>
          <DialogDescription>
            Select a new plan to upgrade or downgrade your subscription. Changes will take effect at
            the end of your current billing period.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3 py-4">
          {sortedPlans.map((plan: any) => {
            const isActive = plan.id === activePlanId || plan.isActivePlan;
            const isSelected = selectedPlan?.id === plan.id;
            const price = plan.price?.unit_amount || 0;
            const currency = plan.price?.currency?.toUpperCase() || 'USD';
            const proratedAmount = plan.price?.proratedAmount || 0;

            return (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  isActive
                    ? 'border-primary opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                }`}
                onClick={() => handlePlanSelect(plan)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {isActive && (
                        <Badge variant="default" className="mt-1">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <div className="rounded-full bg-primary text-primary-foreground p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {currency} {price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                    {proratedAmount !== 0 && !isActive && (
                      <p className="text-xs text-muted-foreground">
                        Prorated: {currency} {proratedAmount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {plan.description && (
                    <div className="space-y-1">
                      <Separator className="my-3" />
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {(Array.isArray(plan.description) 
                          ? plan.description 
                          : [plan.description]
                        ).map((desc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.quota && (
                    <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                      <p className="font-medium">Quota:</p>
                      <p className="text-muted-foreground">
                        {plan.quota.email.toLocaleString()} emails
                      </p>
                      <p className="text-muted-foreground">
                        {plan.quota.contact.toLocaleString()} contacts
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Referral Code Section */}
        {selectedPlan && !selectedPlan.isActivePlan && (
          <div className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden mb-4">
            {codeVerificationStatus === 'success' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Referral Code Applied!</p>
                      <p className="text-sm text-green-700">
                        {rewardInfo?.discountInPercentage
                          ? `${rewardInfo.discountInPercentage}% discount `
                          : rewardInfo?.trialInDays
                            ? `${Math.floor(rewardInfo.trialInDays / 30)} month free trial `
                            : 'Discount '}
                        will be applied
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                    <Gift className="h-3 w-3 mr-1" />
                    {referralCode}
                  </Badge>
                </div>
              </div>
            )}

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="referral-code" className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      codeVerificationStatus === 'success'
                        ? "bg-green-100"
                        : "bg-primary/10"
                    )}>
                      <Gift className={cn(
                        "h-5 w-5",
                        codeVerificationStatus === 'success'
                          ? "text-green-600"
                          : "text-primary"
                      )} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">
                        {codeVerificationStatus === 'success'
                          ? 'Referral Code Applied'
                          : 'Have a Referral Code?'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {codeVerificationStatus === 'success'
                          ? 'Click to change or remove'
                          : 'Get special discounts and rewards'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4 pt-2">
                    <div className="flex gap-2">
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
                          className="pr-10 h-11"
                        />
                        {codeVerificationStatus === 'success' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                        {codeVerificationStatus === 'error' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                            <XCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {codeVerificationStatus === 'success' ? (
                        <Button variant="outline" onClick={handleClearReferralCode} className="h-11">
                          <XCircle className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          onClick={handleVerifyReferralCode}
                          disabled={isVerifyingCode || !referralCode.trim()}
                          className="h-11"
                        >
                          {isVerifyingCode ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Apply Code
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {codeVerificationStatus === 'error' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">
                          Invalid referral code. Please check and try again.
                        </p>
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">How it works:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• Enter your referral code above</li>
                            <li>• Get instant discounts or free trial months</li>
                            <li>• Applied automatically to your payment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {selectedPlan && !selectedPlan.isActivePlan && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Selected Plan</p>
                <p className="text-lg font-semibold">{selectedPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">New Monthly Price</p>
                <p className="text-lg font-semibold">
                  {selectedPlan.price?.currency?.toUpperCase() || 'USD'}{' '}
                  {selectedPlan.price?.unit_amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            {selectedPlan.price?.proratedAmount && selectedPlan.price.proratedAmount !== 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Prorated amount for remaining billing period:{' '}
                  <span className="font-semibold text-foreground">
                    {selectedPlan.price.currency?.toUpperCase() || 'USD'}{' '}
                    {selectedPlan.price.proratedAmount.toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleUpgrade}
            loading={isProcessing}
            disabled={!selectedPlan || selectedPlan.isActivePlan}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isUpgrade ? (
              <>
                <ArrowUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </>
            ) : (
              <>
                <ArrowDown className="mr-2 h-4 w-4" />
                Downgrade Plan
              </>
            )}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
