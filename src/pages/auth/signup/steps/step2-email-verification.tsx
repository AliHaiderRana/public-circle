import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resendEmailVerification, verifyEmailCode } from '@/actions/signup';
import { setSession } from '@/auth/utils/jwt';
import { toast } from 'sonner';
import axios from '@/lib/api';

interface Step2EmailVerificationProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  emailAddress: string;
  isInvited: boolean;
}

export function Step2EmailVerification({
  setActiveStep,
  emailAddress,
}: Step2EmailVerificationProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (token) {
      handleTokenVerification();
    }
  }, [token]);

  const handleTokenVerification = async () => {
    setIsVerifying(true);
    try {
      setSession(token!);
      const res = await axios.post('/auth/verify-email', { token });
      if (res?.status === 200) {
        setIsVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => setActiveStep(3), 1000);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyEmailCode({ verificationCode: code });
      if (res?.status === 200) {
        setIsVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => setActiveStep(3), 1000);
      }
    } catch (error) {
      // Error handled in action
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendEmailVerification();
      toast.success('Verification email resent!');
    } catch (error) {
      // Error handled in action
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <p className="text-lg font-medium">Email Verified!</p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to <strong>{emailAddress}</strong>
        </p>
      </div>

      {!token && (
        <>
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={handleCodeVerification}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>
        </>
      )}

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? 'Resending...' : "Didn't receive code? Resend"}
        </Button>
      </div>
    </div>
  );
}
