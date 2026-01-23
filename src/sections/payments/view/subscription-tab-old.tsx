import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  updateSubscription,
  createSubscription,
} from '@/actions/payments';
import { verifyReferalCode } from '@/actions/signup';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Check, Info, Gift, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { QuotaDisplay } from './quota-display';
import { PaymentSummaryCard } from './payment-summary-card';
import { BillingAddressCard } from './billing-address-card';
import { PlanUpgradeDialog } from './plan-upgrade-dialog';

// ----------------------------------------------------------------------

export function SubscriptionTab() {
  const { activePlans, isLoading } = getActivePlans();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      await cancelSubscription();
      setCancelDialogOpen(false);
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsProcessing(true);
    try {
      await resumeSubscription();
      setResumeDialogOpen(false);
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (!activePlans || activePlans.length === 0) {
    return <NoSubscriptionPlanSelection />;
  }

  const plan = activePlans[0];
  const isCanceled = plan.isSubscriptionCanceled;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            <Badge variant={isCanceled ? 'destructive' : 'default'}>
              {isCanceled ? 'Canceling' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan Name</p>
              <p className="text-lg font-semibold mt-1">{plan.productName || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-lg font-semibold mt-1">{plan.productPrice || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
              <p className="text-sm font-mono mt-1 text-muted-foreground">
                {plan.subscriptionId || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {isCanceled ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Will cancel at period end</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isCanceled ? (
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => setResumeDialogOpen(true)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Resume Subscription'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => setUpgradeDialogOpen(true)}
                disabled={isProcessing}
              >
                Change Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isProcessing}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentSummaryCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuotaDisplay />
        <BillingAddressCard />
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Your subscription will remain
              active until the end of the current billing period, and you'll continue to have
              access to all features until then.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Cancel Subscription'
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
              Your subscription will continue as normal and you'll be billed at the end of the
              current period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResumeSubscription} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Resume Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Upgrade/Downgrade Dialog */}
      <PlanUpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
    </div>
  );
}

// ----------------------------------------------------------------------
// Inline Plan Selection Component (when no subscription exists)
// ----------------------------------------------------------------------

function NoSubscriptionPlanSelection() {
  const { plans, isLoading: plansLoading } = getPlans(100);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeVerificationStatus, setCodeVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifiedCoupon, setVerifiedCoupon] = useState<string | null>(null);
  const [rewardInfo, setRewardInfo] = useState<any>(null);

  // Separate plans and add-ons
  const { regularPlans, addOns } = useMemo(() => {
    if (!plans || plans.length === 0) return { regularPlans: [], addOns: [] };

    const addOnsList = plans.filter((plan: any) => plan.metadata?.isAddOn === 'true');
    const plansList = plans
      .filter((plan: any) => !plan.metadata?.isAddOn)
      .sort((a: any, b: any) => (a.price?.unit_amount || 0) - (b.price?.unit_amount || 0));

    return { regularPlans: plansList, addOns: addOnsList };
  }, [plans]);

  // Auto-select first plan
  useEffect(() => {
    if (regularPlans.length > 0 && !selectedPlan) {
      setSelectedPlan(regularPlans[0]);
    }
  }, [regularPlans, selectedPlan]);

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
  };

  const handleAddOnToggle = (addOn: any, checked: boolean) => {
    if (checked) {
      setSelectedAddOns([...selectedAddOns, addOn]);
    } else {
      setSelectedAddOns(selectedAddOns.filter((a: any) => a.id !== addOn.id));
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
    return (unitAmount / 100).toFixed(2);
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
        total = total - (rewardInfo.discounts.fixedDiscount * 100); // fixedDiscount is in dollars
      }
    }

    return formatPrice(Math.max(0, total));
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setIsProcessing(true);
    try {
      // Build items array with plan and add-ons
      const items = [
        { price: selectedPlan.price?.id || selectedPlan.default_price || selectedPlan.id },
        ...selectedAddOns.map((addOn: any) => ({
          price: addOn.price?.id || addOn.default_price || addOn.id,
        })),
      ];

      // Pass coupon if verified
      await createSubscription(items, verifiedCoupon || undefined);
      // Page will refresh via SWR revalidation
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
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
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
    <div className="space-y-6">
      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
          <CardDescription>Select a subscription plan that fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {regularPlans.map((plan: any) => {
              const isSelected = selectedPlan?.id === plan.id;
              const price = plan.price?.unit_amount || 0;
              const currency = plan.price?.currency?.toUpperCase() || 'USD';

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {isSelected && (
                        <div className="rounded-full bg-primary text-primary-foreground p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${formatPrice(price)}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                    </div>

                    {plan.description && (
                      <div className="space-y-1">
                        <Separator className="my-3" />
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {(Array.isArray(plan.description)
                            ? plan.description
                            : [plan.description]
                          ).map((desc: string, idx: number) => (
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
                          {plan.quota.email?.toLocaleString()} emails
                        </p>
                        <p className="text-muted-foreground">
                          {plan.quota.contact?.toLocaleString()} contacts
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add-ons Section */}
      {addOns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
            <CardDescription>Enhance your subscription with these add-ons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {addOns.map((addOn: any) => {
                const isChecked = selectedAddOns.some((a: any) => a.id === addOn.id);
                const isDedicatedIP = addOn.name?.toLowerCase().includes('dedicated');
                const isRemoveReference = addOn.name?.toLowerCase().includes('remove') ||
                                          addOn.name?.toLowerCase().includes('reference');

                return (
                  <div
                    key={addOn.id}
                    className={`flex items-start justify-between p-4 border rounded-lg transition-all ${
                      isChecked ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        id={`addon-${addOn.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleAddOnToggle(addOn, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`addon-${addOn.id}`} className="font-medium cursor-pointer">
                            {addOn.name}
                          </Label>
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
                        {isDedicatedIP && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Request will be processed within 24 hours
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatPrice(addOn.price?.unit_amount || 0)}/mo</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Referral Code</CardTitle>
          </div>
          <CardDescription>Have a referral code? Apply it for special discounts</CardDescription>
        </CardHeader>
        <CardContent>
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
                disabled={isVerifyingCode || codeVerificationStatus === 'success'}
                className="pr-10"
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
              <Button
                variant="outline"
                onClick={handleClearReferralCode}
              >
                Clear
              </Button>
            ) : (
              <Button
                onClick={handleVerifyReferralCode}
                disabled={isVerifyingCode || !referralCode.trim()}
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
            )}
          </div>
          {codeVerificationStatus === 'success' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Gift className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {rewardInfo?.discountInPercentage
                    ? `${rewardInfo.discountInPercentage}% discount will be applied!`
                    : rewardInfo?.trialInDays
                      ? `${Math.floor(rewardInfo.trialInDays / 30)} month${Math.floor(rewardInfo.trialInDays / 30) > 1 ? 's' : ''} free trial!`
                      : rewardInfo?.discounts?.percentageDiscount
                        ? `${rewardInfo.discounts.percentageDiscount}% discount will be applied!`
                        : rewardInfo?.discounts?.fixedDiscount
                          ? `$${rewardInfo.discounts.fixedDiscount} discount will be applied!`
                          : 'Discount will be applied!'}
                </span>
              </div>
            </div>
          )}
          {codeVerificationStatus === 'error' && (
            <p className="mt-2 text-sm text-red-600">Invalid referral code. Please try again.</p>
          )}
        </CardContent>
      </Card>

      {/* Summary & Subscribe */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your selected plan and add-ons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Plan */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{selectedPlan.name}</h4>
                {selectedPlan.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Array.isArray(selectedPlan.description)
                      ? selectedPlan.description[0]
                      : selectedPlan.description}
                  </p>
                )}
              </div>
              <div className="ml-4 text-right">
                <p className="font-semibold">${formatPrice(selectedPlan.price?.unit_amount || 0)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>

            {/* Add-ons */}
            {selectedAddOns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h5 className="text-sm font-medium">Add-ons</h5>
                  {selectedAddOns.map((addOn: any) => (
                    <div key={addOn.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">{addOn.name}</p>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-semibold">${formatPrice(addOn.price?.unit_amount || 0)}</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Discount/Reward */}
            {verifiedCoupon && rewardInfo && (
              <>
                <Separator />
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    {rewardInfo.trialInDays > 0
                      ? `${Math.floor(rewardInfo.trialInDays / 30)} month${Math.floor(rewardInfo.trialInDays / 30) > 1 ? 's' : ''} free trial`
                      : rewardInfo.discountInPercentage > 0
                        ? `${rewardInfo.discountInPercentage}% discount applied`
                        : rewardInfo.discounts?.percentageDiscount > 0
                          ? `${rewardInfo.discounts.percentageDiscount}% discount applied`
                          : rewardInfo.discounts?.fixedDiscount > 0
                            ? `$${rewardInfo.discounts.fixedDiscount} discount applied`
                            : 'Special offer applied'}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Subtotal and Discount breakdown */}
            {verifiedCoupon && rewardInfo && (rewardInfo.discountInPercentage > 0 || rewardInfo.discounts?.percentageDiscount > 0 || rewardInfo.discounts?.fixedDiscount > 0) && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${formatPrice(calculateSubtotal())}/mo</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>
                    Discount ({rewardInfo.discountInPercentage || rewardInfo.discounts?.percentageDiscount || 0}%)
                  </span>
                  <span>
                    -${formatPrice(calculateSubtotal() * (rewardInfo.discountInPercentage || rewardInfo.discounts?.percentageDiscount || 0) / 100)}
                  </span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${calculateTotal()}/mo</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Billed monthly
            </p>

            <Button
              onClick={handleSubscribe}
              className="w-full"
              disabled={isProcessing || !selectedPlan}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
