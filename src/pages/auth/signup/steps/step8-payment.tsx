import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  updateUser,
  activateCompany,
  attachPaymentMethod,
  createSubscription,
  requestIp,
} from "@/actions/signup";
import { useAuthContext } from "@/auth/hooks/use-auth-context";
import { toast } from "sonner";
import { paths } from "@/routes/paths";
import { CheckCircle2, Loader2 } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY || "");

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

  const selectedPlan = selectedItems.find(
    (item: any) => !item?.metadata?.isAddOn,
  );
  const selectedAddOns = selectedItems.filter(
    (item: any) => item?.metadata?.isAddOn === "true",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe has not loaded yet");
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Error submitting payment form");
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        toast.error(confirmError.message || "Error creating payment method");
        setIsProcessing(false);
        return;
      }

      const paymentMethodId = setupIntent?.payment_method;

      if (!paymentMethodId) {
        toast.error("Payment method not found");
        setIsProcessing(false);
        return;
      }

      const attachRes = await attachPaymentMethod({
        paymentMethodId: paymentMethodId as string,
      });

      if (attachRes?.status === 200) {
        const coupon = localStorage.getItem("referalCode") || "";
        const subscriptionRes = await createSubscription({
          items: [selectedPlan, ...selectedAddOns].map((item: any) => ({
            price: item?.price?.id,
          })),
          coupon: coupon || undefined,
        });

        if (subscriptionRes?.status === 200) {
          const hasDedicatedItem = selectedItems.some(
            (item: any) => item?.name && item?.name?.includes("Dedicated"),
          );

          if (hasDedicatedItem) {
            await requestIp({ requested: true });
          }

          localStorage.removeItem("referalCode");
          await checkUserSession?.();
          await updateUser({ signUpStepsCompleted: 8 });
          await activateCompany();
          await checkUserSession?.();

          toast.success("Payment successful! Welcome to Public Circles.");
          onSuccess();
        } else {
          toast.error("Subscription creation failed");
        }
      } else {
        toast.error("Failed to attach payment method");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error?.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

export function Step8Payment({
  selectedItems,
  reward,
  clientSecret,
}: Step8PaymentProps) {
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);

  const selectedPlan = selectedItems?.find(
    (item: any) => !item?.metadata?.isAddOn,
  );
  const selectedAddOns =
    selectedItems?.filter((item: any) => item?.metadata?.isAddOn === "true") ||
    [];

  const formatPrice = (unitAmount: number) => {
    return unitAmount.toFixed(2);
  };

  const calculateSubtotal = () => {
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

  const subtotal = calculateSubtotal();
  const discountAmount = reward?.discountInPercentage
    ? subtotal * (reward.discountInPercentage / 100)
    : 0;
  const totalCost = subtotal - discountAmount;

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
        <p className="text-sm text-muted-foreground">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Order Summary */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Order Summary</h3>
          <p className="text-sm text-muted-foreground">
            Review your selected plan and add-ons
          </p>
        </div>

        {/* Plan */}
        {selectedPlan && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{selectedPlan.name}</span>
              <span className="text-sm font-semibold">
                ${formatPrice(selectedPlan.price?.unit_amount || 0)}
              </span>
            </div>
            {Array.isArray(selectedPlan.description) ? (
              <p className="text-xs text-muted-foreground">
                {selectedPlan.description.join(" • ")}
              </p>
            ) : (
              selectedPlan.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlan.description}
                </p>
              )
            )}
          </div>
        )}

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Add-ons</h4>
              {selectedAddOns.map((addOn: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{addOn.name}</span>
                    <span className="text-sm font-medium">
                      ${formatPrice(addOn.price?.unit_amount || 0)}
                    </span>
                  </div>
                  {addOn.description && (
                    <p className="text-xs text-muted-foreground">
                      {addOn.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Discount */}
        {reward?.discountInPercentage > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center text-green-600">
              <span className="text-sm font-medium">
                Discount ({reward.discountInPercentage}%)
              </span>
              <span className="text-sm font-semibold">
                -${formatPrice(discountAmount)}
              </span>
            </div>
          </>
        )}

        <Separator />

        {/* Total */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold">Total Due</span>
            <span className="text-lg font-bold">${formatPrice(totalCost)}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Billed monthly
          </p>
        </div>
      </div>

      {/* Right Side - Payment Form */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Complete Payment</h3>
          <p className="text-sm text-muted-foreground">
            Enter your payment details
          </p>
        </div>

        {clientSecret && clientSecret.trim() !== "" ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              selectedItems={selectedItems}
              reward={reward}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
