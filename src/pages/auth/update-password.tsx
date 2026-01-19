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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={paths.auth.jwt.resetPassword}>
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription className="pt-2">
            You can reset your password here. Confirm password should be same as password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8+ characters"
                  {...register('password')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="8+ characters"
                  {...register('confirmPassword')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            {passwordValue && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Password requirements:</p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className={hasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                      {hasMinLength ? '✓' : '○'}
                    </span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className={hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}>
                      {hasLowerCase ? '✓' : '○'}
                    </span>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className={hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}>
                      {hasUpperCase ? '✓' : '○'}
                    </span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className={hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                      {hasNumber ? '✓' : '○'}
                    </span>
                    One number
                  </li>
                  <li className={`flex items-center gap-2 ${hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <span className={hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}>
                      {hasSpecialChar ? '✓' : '○'}
                    </span>
                    One special character
                  </li>
                </ul>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to={paths.auth.jwt.signIn}
              className="text-sm text-primary hover:underline font-medium"
            >
              Return to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
