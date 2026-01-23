import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { resendEmailVerification, sendEmailVerification } from '@/actions/signup';
import { setSession } from '@/auth/utils/jwt';
import { toast } from 'sonner';
import axios from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Mail } from 'lucide-react';

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
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-sidebar-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-7 w-7 text-sidebar-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to:
        </p>
        <div className="bg-muted rounded-lg py-3 px-4 inline-block mx-auto">
          <span className="font-medium text-foreground">{emailAddress}</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Please check your inbox and click the link to continue.
      </p>

      {!isInvited && (
        <Button
          type="button"
          size="sm"
          className="mx-auto"
          onClick={handleResend}
          disabled={isResending || buttonDisabled || cooldownSeconds > 0}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
          {isResending
            ? 'Sending...'
            : cooldownSeconds > 0
            ? `Resend in ${cooldownSeconds}s`
            : 'Resend Verification Link'}
        </Button>
      )}
    </div>
  );
}
