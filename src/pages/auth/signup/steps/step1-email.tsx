import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sendEmailVerification } from '@/actions/signup';
import { SignUpTerms } from '@/components/auth/signup-terms';
import { toast } from 'sonner';
import { REGION_KEY, STORAGE_KEY } from '@/config/config';

const schema = z.object({
  businessEmail: z
    .string()
    .min(1, { message: 'Business email is required!' })
    .email({ message: 'Business email must be a valid email address!' }),
  referalCode: z.string().optional(),
  emailPreferences: z.boolean(),
  region: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Step1EmailProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  setEmailAddress: (email: string) => void;
}

export function Step1Email({ setActiveStep, setEmailAddress }: Step1EmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessEmail: '',
      referalCode: '',
      emailPreferences: false,
      region: '',
    },
  });

  // Load region from localStorage on mount
  useEffect(() => {
    const storedRegion = localStorage.getItem(REGION_KEY);
    if (storedRegion) {
      setValue('region', storedRegion);
    }
  }, [setValue]);

  const selectedRegion = watch('region');

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Save region to localStorage if provided
      if (data.region) {
        localStorage.setItem(REGION_KEY, data.region);
      }
      
      const region = data.region || localStorage.getItem(REGION_KEY);
      
      const res = await sendEmailVerification({
        emailAddress: data.businessEmail,
        receiveEmailsFromPublicCircles: emailPreferences,
        ...(region && { region }),
      });

      if (res?.status === 200) {
        toast.success(res?.data?.message || 'Verification email sent!');
        setEmailAddress(data.businessEmail);
        setActiveStep(2);
        localStorage.removeItem('authToken');
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="businessEmail">Business Email</Label>
        <Input
          id="businessEmail"
          type="email"
          placeholder="your@email.com"
          {...register('businessEmail')}
        />
        {errors.businessEmail && (
          <p className="text-sm text-destructive">{errors.businessEmail.message}</p>
        )}
      </div>

      <SignUpTerms
        emailPreferences={emailPreferences}
        setEmailPreferences={setEmailPreferences}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Sign Up'}
      </Button>
    </form>
  );
}
