import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithPassword } from '@/auth/actions/auth';
import { activateCompany } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { Logo } from '@/components/logo/logo';
import { RegionSelector } from '@/components/auth/region-selector';
import { LanguageSelector } from '@/components/auth/language-selector';

const signInSchema = z.object({
  emailAddress: z
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: z
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspendedUserData, setSuspendedUserData] = useState<SignInFormValues | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isKeepingSuspended, setIsKeepingSuspended] = useState(false);
  const { checkUserSession } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const proceedWithSignIn = async (data: SignInFormValues) => {
    try {
      setErrorMsg('');
      const result = await signInWithPassword(data);
      
      // Check if company is suspended
      if (result?.user?.company?.status === 'SUSPENDED') {
        setSuspendedUserData(data);
        setShowSuspendedModal(true);
      } else {
        // Refresh auth session
        await checkUserSession?.();
        const returnTo = searchParams.get('returnTo') || paths.dashboard.analytics;
        navigate(returnTo, { replace: true });
        toast.success('Signed in successfully');
      }
    } catch (error: any) {
      console.error('Error during sign in:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to sign in';
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
    }
  };

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    try {
      await proceedWithSignIn(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const res = await activateCompany();
      if (res?.status === 200) {
        setShowSuspendedModal(false);
        toast.success(res?.data?.message || 'Account reactivated successfully');
        
        // Proceed with sign-in after reactivation
        if (suspendedUserData) {
          setIsLoading(true);
          await proceedWithSignIn(suspendedUserData);
          setIsLoading(false);
        }
      } else {
        setIsReactivating(false);
        setShowSuspendedModal(false);
      }
    } catch (error: any) {
      console.error('Error reactivating company:', error);
      const errorMessage =
        error?.response?.data?.errorMessage || error?.message || 'Failed to reactivate account';
      toast.error(errorMessage);
      setShowSuspendedModal(false);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleKeepSuspended = async () => {
    setIsKeepingSuspended(true);
    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsKeepingSuspended(false);
      setShowSuspendedModal(false);
      setSuspendedUserData(null);
    }
  };

  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        {/* Fixed Header - Currency and Language Selectors */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <RegionSelector />
          <LanguageSelector />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo isSingle={false} width={180} height={40} disableLink />
        </div>

        {/* Card */}
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to sign in to your account
              </p>
            </div>

            <div className="p-6 pt-0">
              {errorMsg && (
                <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="emailAddress">Email</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    placeholder="m@example.com"
                    {...register('emailAddress')}
                  />
                  {errors.emailAddress && (
                    <p className="text-sm text-destructive">{errors.emailAddress.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to={paths.auth.jwt.resetPassword}
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || isReactivating}>
                  {isLoading ? 'Signing in...' : 'Login'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to={paths.auth.jwt.signUp} className="underline underline-offset-4 hover:text-foreground">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-balance text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Suspended Account Modal */}
      <Dialog
        open={showSuspendedModal}
        onOpenChange={(open) => {
          if (!isReactivating && !isKeepingSuspended) {
            setShowSuspendedModal(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Suspended</DialogTitle>
            <DialogDescription>
              Your account is currently suspended. You have two options:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              • <strong>Reactivate:</strong> Continue with the sign-in process and restore your
              account access
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Keep Suspended:</strong> Close this dialog and maintain your account
              suspended status
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleKeepSuspended}
              disabled={isReactivating || isKeepingSuspended}
            >
              {isKeepingSuspended ? 'Processing...' : 'Keep Suspended'}
            </Button>
            <Button
              onClick={handleReactivate}
              disabled={isReactivating || isKeepingSuspended}
            >
              {isReactivating ? 'Reactivating...' : 'Reactivate Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
