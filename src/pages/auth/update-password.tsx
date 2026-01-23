import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import axios from '@/lib/api';
import { setSession } from '@/auth/utils/jwt';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { Logo } from '@/components/logo/logo';

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: 'Password is required!' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[a-z]/, { message: 'Password must include at least one lowercase letter' })
      .regex(/[A-Z]/, { message: 'Password must include at least one uppercase letter' })
      .regex(/[0-9]/, { message: 'Password must include at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must include at least one special character' }),
    confirmPassword: z.string().min(1, { message: 'Confirm Password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = (location.state as { token?: string }) || {};
  const { checkUserSession } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const passwordValue = watch('password', '');

  // Check password requirements
  const hasMinLength = passwordValue.length >= 8;
  const hasLowerCase = /[a-z]/.test(passwordValue);
  const hasUpperCase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(passwordValue);

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    if (!token) {
      toast.error('Reset token is missing. Please request a new password reset.');
      return;
    }

    try {
      const res = await axios.post(`/auth/reset-password/${token}`, {
        newPassword: data.password,
      });

      if (res?.status === 200) {
        setSession(token);
        toast.success(res?.data?.message || 'Password updated successfully');

        setTimeout(async () => {
          await checkUserSession?.();
          navigate(paths.auth.jwt.signIn);
        }, 1000);
      } else {
        toast.error(res?.data?.message || 'Failed to update password');
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to update password'
      );
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl">
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
              <div className="px-8 pt-10 pb-6">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <Logo isSingle={false} width={140} height={32} disableLink />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
                <p className="text-sm text-muted-foreground">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <div className="px-8 pb-10">
                <Link to={paths.auth.jwt.resetPassword}>
                  <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all">
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {/* Card */}
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            {/* Header Section */}
            <div className="px-8 pt-10 pb-6">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <Logo isSingle={false} width={140} height={32} disableLink />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Reset password</h1>
              <p className="text-sm text-muted-foreground">
                You can reset your password here. Confirm password should be same as password.
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8+ characters"
                      {...register('password')}
                      className="pl-10 pr-10 h-12 rounded-xl "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="8+ characters"
                      {...register('confirmPassword')}
                      className="pl-10 pr-10 h-12 rounded-xl "
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Password Requirements */}
                {passwordValue && (
                  <div className="space-y-2 p-4 bg-muted rounded-xl">
                    <p className="text-sm font-medium text-foreground">Password requirements:</p>
                    <ul className="space-y-1.5 text-sm">
                      <li className={`flex items-center gap-2 ${hasMinLength ? 'text-primary' : 'text-muted-foreground'}`}>
                        <span>{hasMinLength ? '✓' : '○'}</span>
                        At least 8 characters
                      </li>
                      <li className={`flex items-center gap-2 ${hasLowerCase ? 'text-primary' : 'text-muted-foreground'}`}>
                        <span>{hasLowerCase ? '✓' : '○'}</span>
                        One lowercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${hasUpperCase ? 'text-primary' : 'text-muted-foreground'}`}>
                        <span>{hasUpperCase ? '✓' : '○'}</span>
                        One uppercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${hasNumber ? 'text-primary' : 'text-muted-foreground'}`}>
                        <span>{hasNumber ? '✓' : '○'}</span>
                        One number
                      </li>
                      <li className={`flex items-center gap-2 ${hasSpecialChar ? 'text-primary' : 'text-muted-foreground'}`}>
                        <span>{hasSpecialChar ? '✓' : '○'}</span>
                        One special character
                      </li>
                    </ul>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update password'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to={paths.auth.jwt.signIn}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
