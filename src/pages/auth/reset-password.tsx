import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { forgotPassword } from '@/auth/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { Mail } from 'lucide-react';
import { Logo } from '@/components/logo/logo';

const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle token redirect to update-password
  useEffect(() => {
    if (token) {
      setIsRedirecting(true);
      setTimeout(() => {
        navigate(paths.auth.jwt.updatePassword, {
          state: { token },
        });
      }, 1000);
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const params = {
        emailOrPhoneNumber: data.email,
      };
      const res = await forgotPassword(params);
      
      if (res) {
        toast.success(res?.message || 'Password reset email sent');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Redirecting...</p>
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
              <h1 className="text-2xl font-bold text-foreground mb-2">Forgot your password?</h1>
              <p className="text-sm text-muted-foreground">
                Please enter the email address associated with your account and we'll email you a link to reset your password.
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      autoFocus
                      {...register('email')}
                      className="pl-10 h-12 rounded-xl "
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? 'Sending...' : 'Reset Password'}
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
