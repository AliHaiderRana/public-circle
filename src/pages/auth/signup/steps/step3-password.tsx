import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { registerUser, updateUser } from '@/actions/signup';
import { setSession } from '@/auth/utils/jwt';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[0-9]/, 'Password must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

interface Step3PasswordProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  emailAddress: string;
  isInvited: boolean;
}

export function Step3Password({ setActiveStep, isInvited }: Step3PasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { checkUserSession } = useAuthContext();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const checkRequirement = (regex: RegExp) => regex.test(password);

  const requirements = [
    { label: 'At least 8 characters', check: () => password.length >= 8 },
    { label: 'One lowercase letter', check: () => checkRequirement(/[a-z]/) },
    { label: 'One uppercase letter', check: () => checkRequirement(/[A-Z]/) },
    { label: 'One number', check: () => checkRequirement(/[0-9]/) },
    { label: 'One special character', check: () => checkRequirement(/[^A-Za-z0-9]/) },
  ];

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isInvited) {
        const res = await updateUser({
          signUpStepsCompleted: 3,
          password: data.password,
        });
        if (res?.status === 200) {
          setActiveStep(4);
        }
      } else {
        const res = await registerUser({ password: data.password });
        if (res?.status === 200) {
          toast.success(res?.data?.message || 'Password set successfully');
          const token = res?.data?.data?.token;
          if (token) {
            setSession(token);
            await checkUserSession?.();
          }
          await updateUser({ signUpStepsCompleted: 3 });
          setActiveStep(4);
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm password"
            {...register('confirmPassword')}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {password && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Password Requirements:</p>
          {requirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {req.check() ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={req.check() ? 'text-green-600' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Setting password...' : 'Continue'}
      </Button>
    </form>
  );
}
