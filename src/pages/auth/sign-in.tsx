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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Don't have an account?{' '}
              <Link to={paths.auth.jwt.signUp} className="text-blue-600 hover:underline">
                Get started
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="email@example.com"
                  {...register('emailAddress')}
                />
                {errors.emailAddress && (
                  <p className="text-sm text-red-500">{errors.emailAddress.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to={paths.auth.jwt.resetPassword}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || isReactivating}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
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
            <p className="text-sm text-gray-600">
              • <strong>Reactivate:</strong> Continue with the sign-in process and restore your
              account access
            </p>
            <p className="text-sm text-gray-600">
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
