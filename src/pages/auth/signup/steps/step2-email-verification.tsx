import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resendEmailVerification, verifyEmailCode, sendEmailVerification } from '@/actions/signup';
import { setSession } from '@/auth/utils/jwt';
import { toast } from 'sonner';
import axios from '@/lib/api';
import { CheckCircle2, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react';

interface Step2EmailVerificationProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  emailAddress: string;
  isInvited: boolean;
}

export function Step2EmailVerification({
  setActiveStep,
  emailAddress,
  isInvited,
}: Step2EmailVerificationProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [, setIsVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTokenVerification = async () => {
    setIsVerifying(true);
    try {
      setSession(token!);
      const res = await axios.post('/auth/verify-email', { token });
      if (res?.status === 200) {
        setIsVerified(true);
        setMessage('Email Verified');
        setDescription(res?.data?.message || 'Your email has been successfully verified.');
        setMessageType('success');
        toast.success('Email verified successfully!');
        setTimeout(() => setActiveStep(3), 1000);
      } else {
        setMessage('Verification Failed');
        setDescription(res?.data?.message || 'The token is expired or invalid.');
        setMessageType('error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessage('Verification Error');
      setDescription(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          errorMessage
      );
      setMessageType('error');
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Verification failed'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleTokenVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);


  const handleCodeVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyEmailCode({ verificationCode: code });
      if (res?.status === 200) {
        setIsVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => setActiveStep(3), 1000);
      }
    } catch {
      // Error handled in action
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setButtonDisabled(true);
    setCooldownSeconds(10);
    try {
      const res = await sendEmailVerification({
        emailAddress: emailAddress,
      });
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'Verification email sent!');
      }
    } catch {
      // Error handled in action
    } finally {
      setIsResending(false);
      
      // Clear any existing interval
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      
      // Start countdown timer
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = null;
            }
            setButtonDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleResendVerificationEmail = async () => {
    setIsResending(true);
    try {
      const res = await resendEmailVerification();
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'Verification email resent!');
      }
    } catch {
      // Error handled in action
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying && token) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Verifying your account...</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="space-y-6 max-w-md mx-auto text-center">
        <div
          className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
            messageType === 'success'
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {messageType === 'success' ? (
            <CheckCircle2 className="h-12 w-12" />
          ) : (
            <XCircle className="h-12 w-12" />
          )}
        </div>

        <div>
          <h3
            className={`text-xl font-semibold mb-2 ${
              messageType === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {isInvited && messageType === 'error' && (
            <p className="text-sm text-muted-foreground mt-2">
              Please contact the admin to get a new link.
            </p>
          )}
        </div>

        {messageType !== 'success' && !isInvited && (
          <Button
            onClick={handleResendVerificationEmail}
            variant="default"
            disabled={isResending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Requesting...' : 'Request New Link'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Verify your email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to:
          </p>
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{emailAddress}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Please check your inbox and click the link to continue.
          </p>
        </div>
      </div>

      {!token && (
        <>
          <div className="space-y-2">
            <Label htmlFor="code">Or enter verification code</Label>
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

      {!isInvited && (
        <div className="text-center space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending || buttonDisabled || cooldownSeconds > 0}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
            {isResending
              ? 'Sending...'
              : cooldownSeconds > 0
              ? `Resend in ${cooldownSeconds}s`
              : "Didn't receive email? Resend"}
          </Button>
          {cooldownSeconds > 0 && (
            <p className="text-xs text-muted-foreground">
              Please wait {cooldownSeconds} second{cooldownSeconds !== 1 ? 's' : ''} before resending
            </p>
          )}
        </div>
      )}
    </div>
  );
}
