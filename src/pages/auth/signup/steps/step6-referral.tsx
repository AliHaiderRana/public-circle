import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { verifyReferalCode, updateUser } from '@/actions/signup';
import { PercentageView } from '@/components/auth/percentage-view';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Gift } from 'lucide-react';
import Confetti from 'react-confetti';

const schema = z.object({
  referalCode: z.string().optional(),
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
  const savedCode = typeof window !== 'undefined' ? localStorage.getItem('referalCode') || '' : '';
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);

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
    if (!code || code.trim() === '') {
      return;
    }
    setIsVerifying(true);
    try {
      const res = await verifyReferalCode({ referralCode: code });
      if (res?.status === 200) {
        setReward(res?.data?.data);
        setVerificationStatus('success');
        localStorage.setItem('referalCode', code);
        toast.success(res?.data?.message || 'Referral code verified!');
        if (res?.data?.data) {
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
          }, 4500);
        }
      } else {
        setVerificationStatus('error');
        toast.error(res?.data?.message || 'Invalid referral code');
      }
    } catch (error: any) {
      setVerificationStatus('error');
      toast.error(error?.response?.data?.message || 'Failed to verify referral code');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (verificationStatus === 'success' && data.referalCode === savedCode) {
      // Code already verified, proceed to next step
      await handleContinue();
      return;
    }
    await verifyCode(data.referalCode || '');
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
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          colors={['#DB7BD0', '#FFD666', '#C684FF', '#006C9C']}
          recycle={false}
        />
      )}
      <div className="space-y-6 max-w-md mx-auto">
        <div className="text-center space-y-2 mb-6">
          <Gift className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-xl font-semibold">Enter Referral Code</h3>
          <p className="text-sm text-muted-foreground">
            Have a referral code? Enter it below to unlock special benefits!
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referalCode">Referral Code</Label>
            <div className="relative">
              <Input
                id="referalCode"
                {...register('referalCode')}
                placeholder="Enter referral code"
                disabled={isVerifying || verificationStatus === 'success'}
                className="pr-10"
              />
              {verificationStatus === 'success' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
              {verificationStatus === 'error' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
              )}
            </div>
            {errors.referalCode && (
              <p className="text-sm text-destructive">{errors.referalCode.message}</p>
            )}
          </div>

          {reward && <PercentageView data={reward} />}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={isVerifying || !referralCode}
              className="flex-1"
            >
              {isVerifying
                ? 'Verifying...'
                : verificationStatus === 'success'
                ? 'Proceed to Payments'
                : 'Apply Code'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
