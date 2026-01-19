import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { runCampaign, getCampaignIdCompany } from '@/actions/campaign';
import { getAllCampaignGroups } from '@/actions/groups';
import { getAllTemplates, getTemplateById } from '@/actions/templates';
import { getAllSegments } from '@/actions/segments';
import { getAllVerifiedEmails } from '@/actions/configurations';
import { sendTestEmail } from '@/actions/filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Eye,
  Send,
  Calendar,
  Clock,
  Users,
  Mail,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { FileAttachmentSection, type AttachmentFile } from '@/components/file-attachment/FileAttachmentSection';
import { TemplatePreviewDrawer } from '@/components/template-editor/TemplatePreviewDrawer';
import { SegmentCountDialog } from '@/components/campaign/SegmentCountDialog';
import { AdvancedSchedulingSection } from '@/components/campaign/AdvancedSchedulingSection';
import { SelectedSegmentsDisplay } from '@/components/campaign/SelectedSegmentsDisplay';

// Enhanced schema with all required fields
const campaignSchema = z
  .object({
    campaignCompanyId: z.string().min(1, 'Campaign ID is required'),
    campaignName: z.string().min(1, 'Campaign name is required').max(200),
    description: z.string().max(1000).optional(),
    companyGroupingId: z.string().min(1, 'Group is required'),
    sourceEmailAddress: z.string().email('Invalid email').min(1, 'From email is required'),
    emailSubject: z.string().min(1, 'Subject is required').max(200),
    emailTemplateId: z.string().min(1, 'Template is required'),
    segmentIds: z.array(z.string()).min(1, 'At least one segment is required'),
    cc: z.array(z.string().email()).max(50, 'Maximum 50 CC emails').optional(),
    bcc: z.array(z.string().email()).max(50, 'Maximum 50 BCC emails').optional(),
    frequency: z.enum(['ONE_TIME', 'MANY_TIMES']),
    runMode: z.enum(['INSTANT', 'SCHEDULE']),
    runSchedule: z.string().optional(),
    isRecurring: z.boolean(),
    isOnGoing: z.boolean(),
    recurringPeriod: z.string().optional(),
    durationValue: z.string().optional(),
    timeUnit: z.enum(['minute', 'hour', 'day', 'month', 'year']).optional(),
    endDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.durationValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration is required for recurring campaigns',
        path: ['durationValue'],
      });
    }
    if (data.runMode === 'SCHEDULE' && !data.runSchedule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule date/time is required',
        path: ['runSchedule'],
      });
    }
  });

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignCreatePage() {
  const navigate = useNavigate();
  const [campaignCompanyId, setCampaignCompanyId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedSegments, setSelectedSegments] = useState<any[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [durationValue, setDurationValue] = useState('');
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour' | 'day' | 'month' | 'year'>('hour');
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmails, setTestEmails] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [verifiedEmailOpen, setVerifiedEmailOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [segmentCountDialogOpen, setSegmentCountDialogOpen] = useState(false);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  const { allGroups } = getAllCampaignGroups();
  const { tempTemplates, templatesLoading } = getAllTemplates();
  const { allSegments, isLoading: segmentsLoading } = getAllSegments();
  const { verifiedEmails, isLoading: verifiedEmailsLoading } = getAllVerifiedEmails();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignCompanyId: '',
      campaignName: '',
      description: '',
      companyGroupingId: '',
      sourceEmailAddress: '',
      emailSubject: '',
      emailTemplateId: '',
      segmentIds: [],
      cc: [],
      bcc: [],
      frequency: 'ONE_TIME',
      runMode: 'INSTANT',
      runSchedule: undefined,
      isRecurring: false,
      isOnGoing: false,
      recurringPeriod: undefined,
      durationValue: '',
      timeUnit: 'hour',
    },
  });

  const watchRunMode = form.watch('runMode');
  const watchIsRecurring = form.watch('isRecurring');
  const watchIsOnGoing = form.watch('isOnGoing');
  const watchFrequency = form.watch('frequency');

  // Generate Campaign Company ID
  const handleGenerateId = async () => {
    try {
      const res = await getCampaignIdCompany();
      if (res?.status === 200) {
        const id = res.data?.data;
        setCampaignCompanyId(id);
        form.setValue('campaignCompanyId', id);
        toast.success('Campaign ID generated');
      }
    } catch (error: any) {
      toast.error('Failed to generate campaign ID');
    }
  };

  // Handle CC email input
  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && ccInput.trim()) {
      e.preventDefault();
      addCcEmail(ccInput.trim());
    } else if (e.key === 'Backspace' && !ccInput && ccEmails.length > 0) {
      removeCcEmail(ccEmails.length - 1);
    }
  };

  const addCcEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email format');
      return;
    }
    if (ccEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }
    if (ccEmails.length >= 50) {
      toast.error('Maximum 50 CC emails allowed');
      return;
    }
    const newEmails = [...ccEmails, email];
    setCcEmails(newEmails);
    form.setValue('cc', newEmails);
    setCcInput('');
  };

  const removeCcEmail = (index: number) => {
    const newEmails = ccEmails.filter((_, i) => i !== index);
    setCcEmails(newEmails);
    form.setValue('cc', newEmails);
  };

  // Handle BCC email input (same logic as CC)
  const handleBccKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && bccInput.trim()) {
      e.preventDefault();
      addBccEmail(bccInput.trim());
    } else if (e.key === 'Backspace' && !bccInput && bccEmails.length > 0) {
      removeBccEmail(bccEmails.length - 1);
    }
  };

  const addBccEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Invalid email format');
      return;
    }
    if (bccEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }
    if (bccEmails.length >= 50) {
      toast.error('Maximum 50 BCC emails allowed');
      return;
    }
    const newEmails = [...bccEmails, email];
    setBccEmails(newEmails);
    form.setValue('bcc', newEmails);
    setBccInput('');
  };

  const removeBccEmail = (index: number) => {
    const newEmails = bccEmails.filter((_, i) => i !== index);
    setBccEmails(newEmails);
    form.setValue('bcc', newEmails);
  };

  // Handle test email
  const handleSendTest = async () => {
    if (!testEmails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emails = testEmails.split(',').map((e) => e.trim()).filter(Boolean);
    const invalidEmails = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (invalidEmails.length > 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendTestEmail({
        sourceEmailAddress: form.getValues('sourceEmailAddress'),
        toEmailAddresses: emails.join(','),
        emailSubject: form.getValues('emailSubject'),
        emailTemplateId: form.getValues('emailTemplateId'),
      });

      if (res?.status === 200) {
        toast.success('Test email sent successfully');
        setTestEmailDialogOpen(false);
        setTestEmails('');
      } else {
        toast.error(res?.message || 'Failed to send test email');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    // Check if any files are still uploading
    const hasUploadingFiles = attachments.some((f) => f.uploading);
    if (hasUploadingFiles) {
      toast.error('Please wait for all files to finish uploading');
      return;
    }

    // Check if any files are not uploaded
    const hasUnuploadedFiles = attachments.some((f) => !f.uploaded);
    if (hasUnuploadedFiles) {
      toast.error('Please wait for all files to finish uploading');
      return;
    }

    try {
      const payload: any = {
        campaignName: data.campaignName,
        campaignCompanyId: data.campaignCompanyId,
        description: data.description,
        companyGroupingId: data.companyGroupingId,
        sourceEmailAddress: data.sourceEmailAddress,
        emailSubject: data.emailSubject,
        emailTemplateId: data.emailTemplateId,
        segmentIds: data.segmentIds,
        runMode: data.runMode,
        isRecurring: data.isRecurring,
        isOnGoing: data.isOnGoing,
        status: 'ACTIVE',
        frequency: data.frequency,
      };

      if (data.cc && data.cc.length > 0) {
        payload.cc = data.cc;
      }
      if (data.bcc && data.bcc.length > 0) {
        payload.bcc = data.bcc;
      }

      if (data.runMode === 'SCHEDULE' && data.runSchedule) {
        payload.runSchedule = new Date(data.runSchedule).toISOString();
      }

      if (data.isRecurring && data.durationValue && data.timeUnit) {
        payload.recurringPeriod = `${data.durationValue} ${data.timeUnit}`;
      }

      // Note: endDate is stored but may need backend support
      if (data.endDate) {
        payload.endDate = new Date(data.endDate).toISOString();
      }

      // Add attachment IDs
      const attachmentIds = attachments.filter((f) => f.uploaded && !f.id.startsWith('temp-')).map((f) => f.id);
      if (attachmentIds.length > 0) {
        payload.attachmentIds = attachmentIds;
      }

      const response = await runCampaign(payload);
      if (response?.status === 200 || response?.data) {
        toast.success('Campaign created successfully');
        navigate(paths.dashboard.campaign.root);
      } else {
        if (response?.kind === 'BANDWIDTH_LIMIT_REACHED' || response?.kind === 'EMAIL_LIMIT_REACHED') {
          toast.error(response?.message || 'Bandwidth or email limit reached');
        } else {
          toast.error(response?.message || 'Failed to create campaign');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create campaign');
    }
  };

  const canSendTest =
    form.watch('sourceEmailAddress') &&
    form.watch('campaignName') &&
    form.watch('emailSubject') &&
    form.watch('emailTemplateId');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(paths.dashboard.campaign.root)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">Set up a new email campaign</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="campaignCompanyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign ID *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Campaign ID" {...field} value={campaignCompanyId || field.value} />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleGenerateId}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                    <FormDescription>Unique identifier for this campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Summer Sale 2024" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive name for your campaign</FormDescription>
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
                      <Textarea placeholder="Optional campaign description..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormDescription>Additional notes about this campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyGroupingId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Group *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value
                              ? allGroups?.find((g: any) => g._id === field.value)?.groupName || 'Select group'
                              : 'Select group'}
                            <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search groups..." />
                          <CommandList>
                            <CommandEmpty>No groups found.</CommandEmpty>
                            <CommandGroup>
                              {allGroups?.map((group: any) => (
                                <CommandItem
                                  value={group.groupName || group.name}
                                  key={group._id}
                                  onSelect={() => {
                                    form.setValue('companyGroupingId', group._id);
                                  }}
                                >
                                  {group.groupName || group.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Select a group for this campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email content and recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="sourceEmailAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>From Email *</FormLabel>
                    <Popover open={verifiedEmailOpen} onOpenChange={setVerifiedEmailOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value || 'Select verified email'}
                            <Mail className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search emails..." />
                          <CommandList>
                            <CommandEmpty>
                              {verifiedEmailsLoading ? 'Loading...' : 'No verified emails found.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {verifiedEmails?.map((email: any) => (
                                <CommandItem
                                  value={email.emailAddress || email}
                                  key={email.emailAddress || email}
                                  onSelect={() => {
                                    const emailAddr = email.emailAddress || email;
                                    form.setValue('sourceEmailAddress', emailAddr);
                                    setVerifiedEmailOpen(false);
                                  }}
                                >
                                  {email.emailAddress || email}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The email address that will send the campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailSubject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Special Offer Inside!" {...field} />
                    </FormControl>
                    <FormDescription>The subject line recipients will see</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailTemplateId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Template *</FormLabel>
                    <div className="flex gap-2">
                      <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn('flex-1 justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {selectedTemplate?.name || 'Select template'}
                              <FileText className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search templates..." />
                            <CommandList>
                              <CommandEmpty>
                                {templatesLoading ? 'Loading...' : 'No templates found.'}
                              </CommandEmpty>
                              <CommandGroup>
                                {tempTemplates?.map((template: any) => (
                                  <CommandItem
                                    value={template.name}
                                    key={template._id}
                                    onSelect={async () => {
                                      const res = await getTemplateById(template._id);
                                      if (res?.status === 200) {
                                        setSelectedTemplate(res.data.data);
                                        form.setValue('emailTemplateId', template._id);
                                        setTemplateOpen(false);
                                      }
                                    }}
                                  >
                                    {template.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (selectedTemplate) {
                            setPreviewDrawerOpen(true);
                          }
                        }}
                        disabled={!selectedTemplate}
                        title="Preview template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>Select an email template for this campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CC Emails */}
              <div className="space-y-2">
                <Label>CC Emails</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[56px]">
                  {ccEmails.map((email, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeCcEmail(index)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    type="text"
                    placeholder={ccEmails.length ? '' : 'Enter CC emails, press Enter (max 50)'}
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    onBlur={() => {
                      if (ccInput.trim()) {
                        addCcEmail(ccInput.trim());
                      }
                    }}
                    className="flex-1 min-w-[120px] sm:min-w-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{ccEmails.length}/50 emails</p>
              </div>

              {/* BCC Emails */}
              <div className="space-y-2">
                <Label>BCC Emails</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[56px]">
                  {bccEmails.map((email, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeBccEmail(index)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    type="text"
                    placeholder={bccEmails.length ? '' : 'Enter BCC emails, press Enter (max 50)'}
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={handleBccKeyDown}
                    onBlur={() => {
                      if (bccInput.trim()) {
                        addBccEmail(bccInput.trim());
                      }
                    }}
                    className="flex-1 min-w-[120px] sm:min-w-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{bccEmails.length}/50 emails</p>
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <FileAttachmentSection
            onFilesChange={setAttachments}
            maxFiles={3}
            allowedTypes={['png', 'pdf', 'doc', 'docx', 'xls', 'xlsx']}
            initialFiles={attachments}
          />

          {/* Audience Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Select segments for this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="segmentIds"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Segments *</FormLabel>
                    <Popover open={segmentOpen} onOpenChange={setSegmentOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn('w-full justify-between', field.value.length === 0 && 'text-muted-foreground')}
                          >
                            {field.value.length > 0
                              ? `${field.value.length} segment${field.value.length > 1 ? 's' : ''} selected`
                              : 'Select segments'}
                            <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search segments..." />
                          <CommandList>
                            <CommandEmpty>
                              {segmentsLoading ? 'Loading...' : 'No segments found.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {allSegments?.map((segment: any) => {
                                const isSelected = field.value.includes(segment._id);
                                return (
                                  <CommandItem
                                    value={segment.name}
                                    key={segment._id}
                                    onSelect={() => {
                                      const newValue = isSelected
                                        ? field.value.filter((id) => id !== segment._id)
                                        : [...field.value, segment._id];
                                      form.setValue('segmentIds', newValue);
                                      setSelectedSegments(
                                        allSegments.filter((s: any) => newValue.includes(s._id))
                                      );
                                    }}
                                  >
                                    <Checkbox checked={isSelected} className="mr-2" />
                                    {segment.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Select at least one segment</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedSegments.length > 0 && (
                <div className="space-y-4">
                  <SelectedSegmentsDisplay
                    segments={selectedSegments}
                    onRemoveSegment={(segmentId) => {
                      const newSegmentIds = form.getValues('segmentIds').filter((id) => id !== segmentId);
                      form.setValue('segmentIds', newSegmentIds);
                      setSelectedSegments(selectedSegments.filter((s) => s._id !== segmentId));
                    }}
                    showTotalCount={true}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSegmentCountDialogOpen(true)}
                    className="w-full"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Check Segment Audience Count
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>Configure how and when the campaign runs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONE_TIME">
                          <div>
                            <div className="font-medium">One time</div>
                            <div className="text-xs text-muted-foreground">
                              People will only enter this campaign the first time they meet the trigger conditions.
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="MANY_TIMES">
                          <div>
                            <div className="font-medium">Every re-match</div>
                            <div className="text-xs text-muted-foreground">
                              People will enter this campaign every time they meet the trigger conditions.
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>How often should this campaign run?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AdvancedSchedulingSection
                runMode={watchRunMode}
                runSchedule={form.watch('runSchedule')}
                isRecurring={watchIsRecurring}
                isOnGoing={watchIsOnGoing}
                recurringPeriod={form.watch('recurringPeriod')}
                durationValue={durationValue}
                timeUnit={timeUnit}
                endDate={endDate}
                onRunModeChange={(mode) => form.setValue('runMode', mode)}
                onRunScheduleChange={(schedule) => form.setValue('runSchedule', schedule)}
                onRecurringChange={(recurring) => {
                  form.setValue('isRecurring', recurring);
                  if (recurring) {
                    form.setValue('isOnGoing', false);
                  }
                }}
                onOngoingChange={(ongoing) => {
                  form.setValue('isOnGoing', ongoing);
                  if (ongoing) {
                    form.setValue('isRecurring', false);
                    setEndDate(undefined);
                  }
                }}
                onDurationChange={(val) => {
                  setDurationValue(val);
                  form.setValue('durationValue', val);
                }}
                onTimeUnitChange={(unit) => {
                  setTimeUnit(unit);
                  form.setValue('timeUnit', unit);
                }}
                onEndDateChange={(date) => {
                  setEndDate(date);
                  form.setValue('endDate', date);
                }}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTestEmailDialogOpen(true)}
              disabled={!canSendTest}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Test
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(paths.dashboard.campaign.root)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Enter email addresses to send a test email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="Enter email addresses separated by commas"
                value={testEmails}
                onChange={(e) => setTestEmails(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={isSendingTest || !testEmails.trim()}>
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
