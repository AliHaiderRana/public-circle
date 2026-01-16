import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { CheckCircle2 } from 'lucide-react';

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
}: Step8PaymentProps) {
  const { checkUserSession } = useAuthContext();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    try {
      // Here you would integrate with Stripe Elements
      // For now, just simulate success
      
      await updateUser({ signUpStepsCompleted: 8 });
      await checkUserSession?.();
      
      setIsComplete(true);
      toast.success('Payment successful! Welcome to Public Circles.');
      
      setTimeout(() => {
        navigate(paths.dashboard.analytics);
      }, 2000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Payment failed');
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
    <div className="space-y-6 max-w-md mx-auto">
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
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing Payment...' : 'Complete Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
