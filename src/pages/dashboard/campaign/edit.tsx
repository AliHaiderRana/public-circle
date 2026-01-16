import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCampaignById, updateCampaign } from '@/actions/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { ArrowLeft } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const campaignSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required').max(200, 'Campaign name must be less than 200 characters'),
  emailSubject: z.string().min(1, 'Email subject is required').max(200, 'Email subject must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sourceEmailAddress: z.string().email('Invalid email address').min(1, 'Source email is required'),
  status: z.enum(['ACTIVE', 'DRAFT', 'PAUSED', 'INACTIVE'], {
    required_error: 'Please select a status',
  }),
  runMode: z.enum(['IMMEDIATE', 'SCHEDULED'], {
    required_error: 'Please select a run mode',
  }),
  frequency: z.enum(['ONE_TIME', 'RECURRING'], {
    required_error: 'Please select a frequency',
  }),
  runSchedule: z.string().optional(),
  isRecurring: z.boolean().default(false),
  isOnGoing: z.boolean().default(false),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignName: '',
      emailSubject: '',
      description: '',
      sourceEmailAddress: '',
      status: 'DRAFT',
      runMode: 'IMMEDIATE',
      frequency: 'ONE_TIME',
      isRecurring: false,
      isOnGoing: false,
    },
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getCampaignById(id)
        .then((response) => {
          if (response?.data?.data) {
            const campaign = response.data.data;
            const runSchedule = campaign.runSchedule
              ? new Date(campaign.runSchedule).toISOString().slice(0, 16)
              : '';

            form.reset({
              campaignName: campaign.campaignName || campaign.subject || '',
              emailSubject: campaign.emailSubject || campaign.subject || '',
              description: campaign.description || '',
              sourceEmailAddress: campaign.sourceEmailAddress || '',
              status: campaign.status || 'DRAFT',
              runMode: campaign.runSchedule ? 'SCHEDULED' : 'IMMEDIATE',
              frequency: campaign.frequency || 'ONE_TIME',
              runSchedule: runSchedule,
              isRecurring: campaign.isRecurring || false,
              isOnGoing: campaign.isOnGoing || false,
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching campaign:', error);
          toast.error('Failed to load campaign data');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, form]);

  const watchFrequency = form.watch('frequency');
  const watchRunMode = form.watch('runMode');

  const onSubmit = async (data: CampaignFormValues) => {
    if (!id) return;

    try {
      const payload = {
        campaignName: data.campaignName,
        emailSubject: data.emailSubject,
        description: data.description || undefined,
        sourceEmailAddress: data.sourceEmailAddress,
        status: data.status,
        runMode: data.runMode,
        frequency: data.frequency,
        isRecurring: data.frequency === 'RECURRING',
        isOnGoing: data.isOnGoing,
        ...(data.runSchedule && data.runMode === 'SCHEDULED' && {
          runSchedule: new Date(data.runSchedule).toISOString(),
        }),
      };

      const response = await updateCampaign(id, payload);
      if (response?.status === 200 || response?.data) {
        toast.success('Campaign updated successfully');
        navigate(paths.dashboard.campaign.details(id));
      } else {
        toast.error('Failed to update campaign');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update campaign');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(id ? paths.dashboard.campaign.details(id) : paths.dashboard.campaign.root)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Update campaign details and settings
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Essential details about your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Summer Sale 2024"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for your campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailSubject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Special Offer Inside!"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The subject line recipients will see
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional campaign description..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional notes about this campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sourceEmailAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="noreply@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The email address that will send the campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Settings</CardTitle>
                  <CardDescription>
                    Configure how and when the campaign runs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Campaign status determines visibility and behavior
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="runMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Mode *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select run mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When should the campaign start?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchRunMode === 'SCHEDULED' && (
                    <FormField
                      control={form.control}
                      name="runSchedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            When to start the campaign
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ONE_TIME">One Time</SelectItem>
                            <SelectItem value="RECURRING">Recurring</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often should this campaign run?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchFrequency === 'RECURRING' && (
                    <FormField
                      control={form.control}
                      name="isOnGoing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ongoing Campaign</FormLabel>
                            <FormDescription>
                              Keep this campaign running continuously
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(id ? paths.dashboard.campaign.details(id) : paths.dashboard.campaign.root)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Updating...' : 'Update Campaign'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
