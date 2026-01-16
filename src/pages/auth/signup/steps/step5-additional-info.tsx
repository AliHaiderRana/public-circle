import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';

interface Step5AdditionalInfoProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
}

// Placeholder - This step would have address fields, etc.
export function Step5AdditionalInfo({ setActiveStep, isInvited }: Step5AdditionalInfoProps) {
  const { checkUserSession } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const res = await updateUser({ signUpStepsCompleted: 5 });
      if (res?.status === 200) {
        await checkUserSession?.();
        setActiveStep(6);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Tell us more about your business (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This step can include address, industry, or other details.
          </p>
          <Button onClick={handleContinue} className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
