import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEmailAddress } from '@/actions/configurations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { ArrowLeft } from 'lucide-react';

const emailSchema = z.object({
  emailAddress: z
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Invalid email address!' }),
  fromName: z.string().min(1, { message: 'From Name is required!' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function NewEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get('domain');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      const result = await createEmailAddress({
        emailAddress: data.emailAddress,
        fromName: data.fromName,
      });

      if (result?.status === 200) {
        toast.success(result?.data?.message || 'Email address added successfully');
        navigate(paths.dashboard.configurations.emailconfiguration);
      } else {
        toast.error(result?.data?.message || 'Failed to add email address');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add email address');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(paths.dashboard.configurations.emailconfiguration)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Email Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Email Address</CardTitle>
          <CardDescription>
            {domain
              ? `Add an email address to domain: ${domain}`
              : 'Add a new email address for sending campaigns'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                type="email"
                placeholder="example@domain.com"
                {...register('emailAddress')}
              />
              {errors.emailAddress && (
                <p className="text-sm text-red-500">{errors.emailAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                type="text"
                placeholder="Your Company Name"
                {...register('fromName')}
              />
              {errors.fromName && (
                <p className="text-sm text-red-500">{errors.fromName.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Email Address'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(paths.dashboard.configurations.emailconfiguration)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
