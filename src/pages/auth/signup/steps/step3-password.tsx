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
  const confirmPassword = watch('confirmPassword', '');

  const checkRequirement = (regex: RegExp) => regex.test(password);

  const requirements = [
    { label: 'At least 8 characters', check: () => password.length >= 8 },
    { label: 'One lowercase letter', check: () => checkRequirement(/[a-z]/) },
    { label: 'One uppercase letter', check: () => checkRequirement(/[A-Z]/) },
    { label: 'One number', check: () => checkRequirement(/[0-9]/) },
    { label: 'One special character', check: () => checkRequirement(/[^A-Za-z0-9]/) },
    { label: 'Passwords match', check: () => password && confirmPassword && password === confirmPassword },
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h3 className="text-xl font-semibold text-center">Thanks for confirming your email!</h3>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="8+ characters"
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
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="8+ characters"
            {...register('confirmPassword')}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <CheckCircle2 className={`h-4 w-4 ${req.check() ? 'text-sidebar-primary' : 'text-muted-foreground/40'}`} />
            <span className={req.check() ? 'text-foreground' : ''}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Setting password...' : 'Next'}
      </Button>
    </form>
  );
}
