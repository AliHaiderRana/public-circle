import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { REGION_KEY } from '@/config/config';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  businessName: z.string().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  secondaryEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  companySize: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Step4CompanyInfoProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
}

export function Step4CompanyInfo({ setActiveStep, isInvited }: Step4CompanyInfoProps) {
  const { signupUser, checkUserSession } = useAuthContext();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: signupUser?.firstName || '',
      lastName: signupUser?.lastName || '',
      businessName: signupUser?.company?.name || '',
      phoneNumber: signupUser?.phoneNumber || '',
      secondaryEmail: signupUser?.secondaryEmail || '',
      companySize: signupUser?.company?.companySize || '1-10',
    },
  });

  useEffect(() => {
    if (signupUser) {
      setValue('firstName', signupUser.firstName || '');
      setValue('lastName', signupUser.lastName || '');
      setValue('businessName', signupUser.company?.name || '');
      setValue('phoneNumber', signupUser.phoneNumber || '');
      setValue('secondaryEmail', signupUser.secondaryEmail || '');
      setValue('companySize', signupUser.company?.companySize || '1-10');
    }
  }, [signupUser, setValue]);

  const companySize = watch('companySize');

  const onSubmit = async (data: FormValues) => {
    try {
      const region = localStorage.getItem(REGION_KEY);
      const params = isInvited
        ? {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            signUpStepsCompleted: 8,
          }
        : {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            ...(data.secondaryEmail && { secondaryEmail: data.secondaryEmail }),
            companyName: data.businessName,
            companySize: data.companySize,
            signUpStepsCompleted: 4,
            ...(region && { currency: region.toUpperCase() === 'CA' ? 'CAD' : 'USD' }),
          };

      const res = await updateUser(params);
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'Information saved');
        await checkUserSession?.();
        if (isInvited) {
          // Redirect for invited users
        } else {
          setActiveStep(5);
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save information');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register('lastName')} />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {!isInvited && (
        <>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" {...register('businessName')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size</Label>
            <Select value={companySize} onValueChange={(value) => setValue('companySize', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10</SelectItem>
                <SelectItem value="11-50">11-50</SelectItem>
                <SelectItem value="51-200">51-200</SelectItem>
                <SelectItem value="201-500">201-500</SelectItem>
                <SelectItem value="500+">500+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" type="tel" {...register('phoneNumber')} />
        {errors.phoneNumber && (
          <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="secondaryEmail">Secondary Email (Optional)</Label>
        <Input id="secondaryEmail" type="email" {...register('secondaryEmail')} />
        {errors.secondaryEmail && (
          <p className="text-sm text-destructive">{errors.secondaryEmail.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
