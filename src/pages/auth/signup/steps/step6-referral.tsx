import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { verifyReferalCode, updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

const schema = z.object({
  referalCode: z.string().min(1, 'Referral code is required'),
});

type FormValues = z.infer<typeof schema>;

interface Step6ReferralProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
  setReward: (reward: any) => void;
  reward: any;
}

export function Step6Referral({
  setActiveStep,
  setReward,
  reward,
}: Step6ReferralProps) {
  const { checkUserSession } = useAuthContext();
  const savedCode = localStorage.getItem('referalCode') || '';
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { referalCode: savedCode },
  });

  const referralCode = watch('referalCode');

  useEffect(() => {
    if (savedCode && !reward) {
      verifyCode(savedCode);
    }
  }, []);

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    try {
      const res = await verifyReferalCode({ referralCode: code });
      if (res?.status === 200) {
        setReward(res?.data?.data);
        setVerificationStatus('success');
        localStorage.setItem('referalCode', code);
        toast.success('Referral code verified!');
      } else {
        setVerificationStatus('error');
      }
    } catch (error) {
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    await verifyCode(data.referalCode);
  };

  const handleSkip = async () => {
    try {
      await updateUser({ signUpStepsCompleted: 6 });
      await checkUserSession?.();
      setActiveStep(7);
    } catch (error) {
      toast.error('Failed to continue');
    }
  };

  const handleContinue = async () => {
    try {
      await updateUser({ signUpStepsCompleted: 6 });
      await checkUserSession?.();
      setActiveStep(7);
    } catch (error) {
      toast.error('Failed to continue');
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referalCode">Referral Code (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="referalCode"
              {...register('referalCode')}
              placeholder="Enter referral code"
              disabled={isVerifying || verificationStatus === 'success'}
            />
            {verificationStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
            {verificationStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
            )}
          </div>
          {errors.referalCode && (
            <p className="text-sm text-destructive">{errors.referalCode.message}</p>
          )}
        </div>

        {!reward && (
          <Button type="submit" disabled={isVerifying} className="w-full">
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </Button>
        )}
      </form>

      {reward && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-900">Referral code verified!</p>
            </div>
            <p className="text-sm text-green-700">
              You'll receive special benefits with this code.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSkip} className="flex-1">
          Skip
        </Button>
        {reward && (
          <Button onClick={handleContinue} className="flex-1">
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
