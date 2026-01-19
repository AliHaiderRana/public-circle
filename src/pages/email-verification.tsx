import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomBreadcrumbs } from '@/components/custom-breadcrumbs';
import { paths } from '@/routes/paths';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/lib/api';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    try {
      const response = await axios.post('/auth/verify-email', {
        token: verificationToken,
      });
      if (response?.status === 200) {
        setIsVerified(true);
        toast.success('Email verified successfully!');
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate(paths.auth.jwt.signIn);
        }, 3000);
      } else {
        setIsVerified(false);
        toast.error('Verification failed. Please try again.');
      }
    } catch (error: any) {
      setIsVerified(false);
      toast.error(
        error?.response?.data?.message || 'Verification failed. The link may have expired.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await axios.post('/auth/resend-verification', { email });
      if (response?.status === 200) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error('Failed to send verification email. Please try again.');
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to send verification email. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <CustomBreadcrumbs
            links={[
              { name: 'Home', href: '/' },
              { name: 'Email Verification' },
            ]}
            heading="Email Verification"
            description="Verify your email address to complete your account setup"
          />
        </div>
      </section>

      {/* Verification Content */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {isVerifying ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <CardTitle className="mb-2">Verifying your email...</CardTitle>
                  <CardDescription>
                    Please wait while we verify your email address.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : isVerified ? (
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">Email Verified!</CardTitle>
                  <CardDescription>
                    Your email address has been successfully verified.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    You can now sign in to your account. Redirecting you to the sign in page...
                  </p>
                  <Button
                    onClick={() => navigate(paths.auth.jwt.signIn)}
                    className="w-full"
                  >
                    Go to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">Verify Your Email</CardTitle>
                  <CardDescription>
                    {token
                      ? 'Verification failed. Please request a new verification email.'
                      : 'Enter your email address to receive a verification link.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <Button
                    onClick={handleResendVerification}
                    className="w-full"
                    disabled={isResending || !email}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => navigate(paths.auth.jwt.signIn)}
                      className="text-sm"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
