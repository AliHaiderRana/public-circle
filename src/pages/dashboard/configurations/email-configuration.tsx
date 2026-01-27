import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronRight,
  Info,
  Loader2,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getAllVerifiedEmails,
  createEmailAddress,
  deleteEmail,
  getAllConfigurations,
  verifyDomain,
  deleteDomain,
  verifyAppleRelay,
  disablePrivateRelay,
} from '@/actions/configurations';
import axios from '@/lib/api';
import { endpoints } from '@/config/config';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';

// Schema for email validation
const emailSchema = z
  .string()
  .min(1, { message: 'Email is required!' })
  .email({ message: 'Invalid email address!' });

// Helper to extract domain from URL
const extractDomain = (url: string) => {
  if (!url) return '';
  let domain = url.trim();
  domain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  return domain.toLowerCase();
};

// Schema for domain validation
const domainSchema = z
  .string()
  .min(1, { message: 'Domain is required!' })
  .refine(
    (val) => {
      const extracted = extractDomain(val);
      return /^(?!www\.)([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(extracted);
    },
    { message: 'Invalid domain name or URL' }
  );

// Configuration schema based on type
const ConfigurationSchema = z
  .object({
    value: z.string().min(1, 'This field is required'),
    fromName: z.string(),
    configurationType: z.enum(['email', 'domain']),
  })
  .superRefine((data, ctx) => {
    if (data.configurationType === 'email') {
      if (!data.fromName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'From Name is required',
          path: ['fromName'],
        });
      }
      const emailResult = emailSchema.safeParse(data.value);
      if (!emailResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: emailResult.error.issues[0].message,
          path: ['value'],
        });
      }
    } else {
      const domainResult = domainSchema.safeParse(data.value);
      if (!domainResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: domainResult.error.issues[0].message,
          path: ['value'],
        });
      }
    }
  });

// Domain email schema
const DomainEmailSchema = z.object({
  localPart: z.string().min(1, 'Email prefix is required').regex(/^[a-zA-Z0-9._%+-]+$/, 'Invalid email prefix'),
  fromName: z.string().min(1, 'From Name is required'),
});

type ConfigFormData = z.infer<typeof ConfigurationSchema>;
type DomainEmailFormData = z.infer<typeof DomainEmailSchema>;

export default function EmailConfigurationPage() {
  const navigate = useNavigate();
  const { isLoading: emailsLoading } = getAllVerifiedEmails();
  const { allConfigurations, isLoading: configLoading } = getAllConfigurations();

  // Stepper dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [configDetails, setConfigDetails] = useState<ConfigFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Domain email dialog state
  const [isDomainEmailDialogOpen, setIsDomainEmailDialogOpen] = useState(false);
  const [selectedDomainForEmail, setSelectedDomainForEmail] = useState<any>(null);
  const [isAddingDomainEmail, setIsAddingDomainEmail] = useState(false);

  // Apple Relay modal state
  const [isAppleRelayModalOpen, setIsAppleRelayModalOpen] = useState(false);
  const [selectedEmailForAppleRelay, setSelectedEmailForAppleRelay] = useState<any>(null);
  const [appleRelayStep, setAppleRelayStep] = useState(0);
  const [isVerifyingAppleRelay, setIsVerifyingAppleRelay] = useState(false);

  // DNS Modal state
  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);
  const [selectedDomainForDns, setSelectedDomainForDns] = useState<any>(null);

  // Other state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'email' | 'domain'; value: string } | null>(null);
  const [disableAppleRelayOpen, setDisableAppleRelayOpen] = useState(false);
  const [emailToDisable, setEmailToDisable] = useState<any>(null);
  const [isDisabling, setIsDisabling] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isLoading = emailsLoading || configLoading;

  // Form for stepper dialog
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(ConfigurationSchema),
    defaultValues: {
      value: '',
      fromName: '',
      configurationType: 'email',
    },
  });

  // Form for domain email
  const {
    register: registerDomainEmail,
    handleSubmit: handleSubmitDomainEmail,
    formState: { errors: domainEmailErrors },
    reset: resetDomainEmail,
  } = useForm<DomainEmailFormData>({
    resolver: zodResolver(DomainEmailSchema),
    defaultValues: {
      localPart: '',
      fromName: '',
    },
  });

  const configurationType = watch('configurationType');

  // Reset form when config type changes
  useEffect(() => {
    setValue('value', '');
    setValue('fromName', '');
    clearErrors();
  }, [configurationType, setValue, clearErrors]);

  // Combine addresses and domains into a single array
  const allConfigurationsCombined = [
    ...(allConfigurations?.addresses || []),
    ...(allConfigurations?.domains || []),
  ];

  // Stepper dialog handlers
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setActiveStep(0);
    setVerificationResult(null);
    setConfigDetails(null);
    reset();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setActiveStep(0);
    setVerificationResult(null);
    setConfigDetails(null);
    reset();
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    const newStep = activeStep - 1;
    setActiveStep(newStep);
    if (newStep === 0) {
      setValue('value', '');
      setValue('fromName', '');
      clearErrors();
    }
  };

  const onSubmitConfig = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      if (data.configurationType === 'domain') {
        const extractedDomain = extractDomain(data.value);
        const result = await verifyDomain({ emailDomain: extractedDomain.toLowerCase() });
        if (result) {
          setVerificationResult(result.data);
          setConfigDetails({ ...data, value: extractedDomain });
          handleNext();
          mutate(endpoints.configurations.configuration);
        }
      } else {
        const result = await createEmailAddress({
          emailAddress: data.value,
          fromName: data.fromName,
        });
        if (result) {
          setVerificationResult(result.data);
          setConfigDetails(data);
          handleNext();
          mutate(endpoints.configurations.configuration);
          mutate(endpoints.configurations.verifiedEmails);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create configuration');
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleVerificationComplete = () => {
    handleCloseDialog();
    mutate(endpoints.configurations.configuration);
  };

  // Domain email handlers
  const handleOpenDomainEmailDialog = (domain: any) => {
    setSelectedDomainForEmail(domain);
    setIsDomainEmailDialogOpen(true);
    resetDomainEmail();
  };

  const handleCloseDomainEmailDialog = () => {
    setIsDomainEmailDialogOpen(false);
    setSelectedDomainForEmail(null);
    resetDomainEmail();
  };

  const onSubmitDomainEmail = handleSubmitDomainEmail(async (data) => {
    if (!selectedDomainForEmail) return;

    setIsAddingDomainEmail(true);
    try {
      const fullEmail = `${data.localPart}@${selectedDomainForEmail.emailDomain}`;
      const result = await axios.post(endpoints.configurations.addDomainEmail, {
        emailAddress: fullEmail,
        emailDomain: selectedDomainForEmail.emailDomain,
        fromName: data.fromName,
      });
      if (result?.status === 200 || result?.data) {
        toast.success('Email address added successfully');
        handleCloseDomainEmailDialog();
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add email');
    } finally {
      setIsAddingDomainEmail(false);
    }
  });

  // Apple Relay handlers
  const handleOpenAppleRelayModal = (config: any) => {
    setSelectedEmailForAppleRelay(config);
    setIsAppleRelayModalOpen(true);
    setAppleRelayStep(0);
  };

  const handleCloseAppleRelayModal = () => {
    setIsAppleRelayModalOpen(false);
    setSelectedEmailForAppleRelay(null);
    setAppleRelayStep(0);
    setIsVerifyingAppleRelay(false);
  };

  const handleAppleRelayNext = () => {
    setAppleRelayStep((prev) => Math.min(prev + 1, 2));
  };

  const handleAppleRelayBack = () => {
    setAppleRelayStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCompleteAppleRelaySetup = async () => {
    if (!selectedEmailForAppleRelay) return;

    setIsVerifyingAppleRelay(true);
    try {
      const senderEmail = selectedEmailForAppleRelay.emailDomain || selectedEmailForAppleRelay.emailAddress;
      const result = await verifyAppleRelay(senderEmail);
      if (result) {
        mutate(endpoints.configurations.configuration);
        handleCloseAppleRelayModal();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to verify Apple Relay');
    } finally {
      setIsVerifyingAppleRelay(false);
    }
  };

  // Disable Apple Relay handlers
  const handleOpenDisableAppleRelay = (config: any) => {
    setEmailToDisable(config);
    setDisableAppleRelayOpen(true);
  };

  const handleDisableAppleRelay = async () => {
    if (!emailToDisable) return;

    setIsDisabling(true);
    try {
      const result = await disablePrivateRelay(emailToDisable.emailAddress || emailToDisable.emailDomain);
      if (result) {
        toast.success('Apple Relay disabled successfully');
        setDisableAppleRelayOpen(false);
        setEmailToDisable(null);
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to disable Apple Relay');
    } finally {
      setIsDisabling(false);
    }
  };

  // Delete handlers
  const handleDeleteEmail = async (emailIdOrAddress: string) => {
    try {
      const result = await deleteEmail(emailIdOrAddress);
      if (result?.status === 200 || result?.data) {
        toast.success('Email deleted successfully');
        mutate(endpoints.configurations.configuration);
        mutate(endpoints.configurations.verifiedEmails);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete email');
    }
  };

  const handleDeleteDomain = async (emailDomain: string) => {
    try {
      const result = await deleteDomain(emailDomain);
      if (result?.status === 200 || result?.data) {
        toast.success('Domain deleted successfully');
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete domain');
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'domain') {
      await handleDeleteDomain(itemToDelete.value);
    } else {
      await handleDeleteEmail(itemToDelete.value);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const openDeleteDialog = (type: 'email' | 'domain', value: string) => {
    setItemToDelete({ type, value });
    setDeleteDialogOpen(true);
  };

  // Copy handler
  const copyToClipboard = (text: string, field?: string) => {
    navigator.clipboard.writeText(text);
    if (field) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
    toast.success('Copied to clipboard');
  };

  // Apple Relay status helper
  const getDomainAppleRelayStatus = (domain: any) => {
    const activeEmails = domain?.addresses?.filter((email: any) => email.status === 'ACTIVE') || [];
    if (activeEmails.length === 0) {
      return { status: 'NO_EMAILS', count: 0, total: 0 };
    }
    const verifiedEmails = activeEmails.filter(
      (email: any) => email?.privateRelayVerificationStatus === 'VERIFIED'
    );
    return {
      status: verifiedEmails.length === activeEmails.length ? 'VERIFIED' : 'PARTIAL',
      count: verifiedEmails.length,
      total: activeEmails.length,
    };
  };

  // Render Apple Relay badge/button for individual emails
  const renderAppleRelayActions = (config: any, isDomain: boolean = false, domainConfig?: any) => {
    const status = config.privateRelayVerificationStatus;
    const isEmailVerified = config.isVerified;
    const isDomainVerified = domainConfig?.isVerified ?? true;
    const canVerify = isDomain ? isDomainVerified : isEmailVerified;

    if (status === 'VERIFIED') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenDisableAppleRelay(config)}
          >
            Disable
          </Button>
        </div>
      );
    }

    if (status === 'IN_PROGRESS') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            In Progress
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenAppleRelayModal(config)}
          >
            Re-verify
          </Button>
        </div>
      );
    }

    // NOT_VERIFIED or undefined
    if (!canVerify) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="opacity-50 cursor-not-allowed">
                Setup
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Please verify {isDomain ? 'domain' : 'email'} first</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => handleOpenAppleRelayModal(config)}
      >
        Setup
      </Button>
    );
  };

  if (isLoading) {
    return <LoadingState variant="table" rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage your verified email addresses and domains
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => mutate(endpoints.configurations.configuration)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Email / Domain
          </Button>
        </div>
      </div>

      {/* Configuration Table */}
      {allConfigurationsCombined.length === 0 ? (
        <EmptyState
          title="No configurations found"
          description="Add an email or domain to get started"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Email & Domain Configurations</CardTitle>
            <CardDescription>
              Manage your verified email addresses and domains in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Name</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        Apple Relay
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Apple Relay allows you to send emails to Apple Private Relay
                                addresses. This feature enables enhanced privacy and security.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allConfigurationsCombined.map((config: any) => {
                    const isDomain = !!config.emailDomain;
                    const appleRelayStatus = isDomain ? getDomainAppleRelayStatus(config) : null;

                    return (
                      <TableRow key={config._id}>
                        <TableCell className="font-medium">
                          {isDomain ? config.emailDomain : config.emailAddress}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {isDomain ? 'Domain' : 'Email'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              config.isVerified
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}
                          >
                            {config.isVerified ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {isDomain ? (
                            <div className="flex items-center justify-center">
                              {appleRelayStatus?.status === 'NO_EMAILS' ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="opacity-60">
                                        No Emails
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add emails to this domain first</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : appleRelayStatus?.status === 'VERIFIED' ? (
                                <Badge variant="default" className="bg-green-500">
                                  Verified ({appleRelayStatus.count})
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  {appleRelayStatus?.count}/{appleRelayStatus?.total} Verified
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              {renderAppleRelayActions(config, false)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isDomain && (
                              <>
                                {/* View DNS Records - Opens Modal */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedDomainForDns(config);
                                          setIsDnsModalOpen(true);
                                        }}
                                      >
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View DNS Records</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* View Emails - Navigates to new page */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate(paths.dashboard.configurations.domainEmails(config.emailDomain))}
                                      >
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Emails</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}

                            {/* Delete */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (isDomain) {
                                        openDeleteDialog('domain', config.emailDomain);
                                      } else {
                                        openDeleteDialog('email', config.emailAddress);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stepper Dialog for New Email/Domain */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Email / Domain Configuration</DialogTitle>
            <DialogDescription>
              Add a new email address or domain for sending campaigns
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 py-4">
            {['Select Type', 'Enter Details', 'Verify'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                    index < activeStep
                      ? 'bg-primary text-primary-foreground'
                      : index === activeStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index < activeStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'ml-2 text-sm',
                    index === activeStep ? 'font-medium' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
                {index < 2 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="py-4">
            {activeStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Configuration Type</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={configurationType}
                      onValueChange={(value: 'email' | 'domain') => setValue('configurationType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Configuration</SelectItem>
                        <SelectItem value="domain">Domain Configuration</SelectItem>
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="mb-2">
                            <strong>Email Configuration:</strong> This option allows the configured
                            email to be used as the sender when a campaign runs.
                          </p>
                          <p>
                            <strong>Domain Configuration:</strong> This option allows you to add
                            associated emails under that domain, enabling them to be used as senders
                            for campaigns.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {configurationType === 'email' ? 'Email Address' : 'Domain / URL'}
                  </Label>
                  <Input
                    id="value"
                    type={configurationType === 'email' ? 'email' : 'text'}
                    placeholder={
                      configurationType === 'email'
                        ? 'email@example.com'
                        : 'example.com or https://example.com'
                    }
                    {...register('value')}
                  />
                  {errors.value && (
                    <p className="text-sm text-destructive">{errors.value.message}</p>
                  )}
                </div>

                {configurationType === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      type="text"
                      placeholder="e.g., John Doe, Support Team"
                      {...register('fromName')}
                    />
                    {errors.fromName && (
                      <p className="text-sm text-destructive">{errors.fromName.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeStep === 2 && configDetails && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">
                    {configDetails.configurationType === 'domain'
                      ? 'Domain Added Successfully!'
                      : 'Email Added - Verification Email Sent!'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {configDetails.configurationType === 'domain'
                      ? 'Please add the DNS records below to verify your domain.'
                      : 'Please check your inbox and click the verification link to complete setup.'}
                  </p>
                </div>

                {configDetails.configurationType === 'domain' && verificationResult?.dnsInfo && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verificationResult.dnsInfo.map((record: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline">{record.Type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs break-all">
                              {record.Name}
                            </TableCell>
                            <TableCell className="font-mono text-xs break-all">
                              {record.Value}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(record.Value, `dns-${index}`)}
                              >
                                {copiedField === `dns-${index}` ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {activeStep > 0 && activeStep < 2 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {activeStep === 0 && (
              <Button onClick={handleNext}>Next</Button>
            )}
            {activeStep === 1 && (
              <Button onClick={onSubmitConfig} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            )}
            {activeStep === 2 && (
              <Button onClick={handleVerificationComplete}>
                {configDetails?.configurationType === 'domain' ? 'Close' : 'Done'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Email Dialog */}
      <Dialog open={isDomainEmailDialogOpen} onOpenChange={setIsDomainEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email to {selectedDomainForEmail?.emailDomain}</DialogTitle>
            <DialogDescription>
              Add a new email address under this domain
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitDomainEmail}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="localPart">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="localPart"
                    type="text"
                    placeholder="username"
                    {...registerDomainEmail('localPart')}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">@{selectedDomainForEmail?.emailDomain}</span>
                </div>
                {domainEmailErrors.localPart && (
                  <p className="text-sm text-destructive">{domainEmailErrors.localPart.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="domainFromName">From Name</Label>
                <Input
                  id="domainFromName"
                  type="text"
                  placeholder="e.g., John Doe, Support Team"
                  {...registerDomainEmail('fromName')}
                />
                {domainEmailErrors.fromName && (
                  <p className="text-sm text-destructive">{domainEmailErrors.fromName.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDomainEmailDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingDomainEmail}>
                {isAddingDomainEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Email'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Apple Relay Setup Modal */}
      <Dialog open={isAppleRelayModalOpen} onOpenChange={setIsAppleRelayModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Apple Relay Setup - {selectedEmailForAppleRelay?.emailAddress || selectedEmailForAppleRelay?.emailDomain}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={handleCloseAppleRelayModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 py-4 border-b">
            {['Prerequisites', selectedEmailForAppleRelay?.emailDomain ? 'Register Domains' : 'Register Emails', 'Verify & Test'].map(
              (label, index) => (
                <button
                  key={label}
                  className="flex items-center"
                  onClick={() => setAppleRelayStep(index)}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                      index < appleRelayStep
                        ? 'bg-primary text-primary-foreground'
                        : index === appleRelayStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {index < appleRelayStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'ml-2 text-sm hidden sm:inline',
                      index === appleRelayStep ? 'font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                  {index < 2 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
                </button>
              )
            )}
          </div>

          {/* Step Content */}
          <div className="py-4 min-h-[300px]">
            {appleRelayStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Prerequisites</h3>
                <p className="text-muted-foreground">
                  Before setting up Apple Relayed Email, ensure you have the following:
                </p>
                <ul className="space-y-2 pl-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>An active Apple Developer account (Individual or Organization)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>A domain you own and control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Email addresses you want to use for communication</span>
                  </li>
                </ul>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm">
                    <strong>Note:</strong> Apple Relayed Email provides enhanced privacy and security
                    by routing emails through Apple's infrastructure with advanced threat protection
                    and automatic forwarding capabilities. No DNS configuration is required.
                  </p>
                </div>
              </div>
            )}

            {appleRelayStep === 1 && selectedEmailForAppleRelay?.emailDomain && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Register Domains</h3>
                <p className="text-muted-foreground">
                  Steps to Register your domains in the Apple Developer Console:
                </p>
                <ol className="space-y-2 pl-4 list-decimal list-inside">
                  <li>Sign in to your Apple Developer account at developer.apple.com</li>
                  <li>Navigate to Certificates, Identifiers & Profiles</li>
                  <li>
                    Click Services in the sidebar, then click Configure under Sign in with Apple
                    for Email Communication
                  </li>
                  <li>In the Email Sources section, click the add button (+)</li>
                  <li>
                    Enter a comma-delimited list of domains and subdomains (e.g., yourdomain.com,
                    mail.yourdomain.com)
                  </li>
                  <li>Click Next, then confirm your entered email sources and click Register</li>
                </ol>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm">
                    <strong>Important:</strong> The table will display if the registered email source
                    passed an SPF check. Apple handles all DNS configuration automatically - no
                    manual DNS setup is required.
                  </p>
                </div>
              </div>
            )}

            {appleRelayStep === 1 && selectedEmailForAppleRelay?.emailAddress && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Register Emails</h3>
                <p className="text-muted-foreground">
                  Steps to Register your email addresses for communication:
                </p>
                <ol className="space-y-2 pl-4 list-decimal list-inside">
                  <li>In Certificates, Identifiers & Profiles, click Services in the sidebar</li>
                  <li>Click Configure under Sign in with Apple for Email Communication</li>
                  <li>In the Email Sources section, click the add button (+) on the top left</li>
                  <li>
                    Enter a comma-delimited list of unique email addresses (e.g.,
                    noreply@yourdomain.com, updates@yourdomain.com)
                  </li>
                  <li>Click Next, then confirm your entered email sources and click Register</li>
                </ol>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm">
                    <strong>Pro Tip:</strong> Use descriptive email addresses like noreply@,
                    updates@, or notifications@ for better organization and to prevent user replies
                    from cluttering inboxes. The table will show SPF check results for each email.
                  </p>
                </div>
              </div>
            )}

            {appleRelayStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verify & Test</h3>
                <p className="text-muted-foreground">
                  Complete these verification and testing steps:
                </p>
                <ul className="space-y-2 pl-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Verify domains/emails are registered in Apple Developer Console</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Confirm SPF checks pass for all registered email sources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Send a test campaign email to apple private email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Verify email delivery</span>
                  </li>
                </ul>
                <div className="rounded-lg border-2 border-primary/50 p-4 bg-primary/5">
                  <h4 className="font-semibold mb-2">🎉 Setup Complete!</h4>
                  <p className="text-sm text-muted-foreground">
                    Your domains/emails are now configured and ready for production use. You can now
                    send campaigns with enhanced deliverability and security through Apple's
                    infrastructure.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {appleRelayStep > 0 && (
              <Button variant="outline" onClick={handleAppleRelayBack}>
                Back
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleCloseAppleRelayModal}>
              Cancel
            </Button>
            {appleRelayStep < 2 && (
              <Button onClick={handleAppleRelayNext}>Next</Button>
            )}
            {appleRelayStep === 2 && (
              <Button onClick={handleCompleteAppleRelaySetup} disabled={isVerifyingAppleRelay}>
                {isVerifyingAppleRelay ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Apple Relay Dialog */}
      <AlertDialog open={disableAppleRelayOpen} onOpenChange={setDisableAppleRelayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Apple Relay Configuration</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to mark{' '}
                <strong>{emailToDisable?.emailAddress || emailToDisable?.emailDomain}</strong> as
                not configured?
              </p>
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="font-medium mb-2">This will:</p>
                <ul className="text-sm space-y-1 pl-4 list-disc">
                  <li>
                    Mark not configured Apple Relay protection for this{' '}
                    {emailToDisable?.emailDomain ? 'domain' : 'email address'}
                  </li>
                  <li>You can re-enable it anytime by clicking Setup again</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableAppleRelay} disabled={isDisabling}>
              {isDisabling ? 'Marking...' : 'Mark not configured'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}?
              {itemToDelete && (
                <span className="font-semibold"> {itemToDelete.value}</span>
              )}
              {' '}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DNS Records Modal */}
      <Dialog open={isDnsModalOpen} onOpenChange={setIsDnsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DNS Records for {selectedDomainForDns?.emailDomain}</DialogTitle>
            <DialogDescription>
              Add these DNS records to your domain's DNS settings to verify your domain
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDomainForDns?.dnsInfo && selectedDomainForDns.dnsInfo.length > 0 ? (
              <div className="space-y-4">
                {selectedDomainForDns.dnsInfo.map((record: any, index: number) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono break-all flex-1">{record.Name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(record.Name, `dns-name-${index}`)}
                        >
                          {copiedField === `dns-name-${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p className="text-sm">{record.Type}</p>
                    </div>

                    {/* Value */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Value</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono break-all flex-1">{record.Value}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(record.Value, `dns-value-${index}`)}
                        >
                          {copiedField === `dns-value-${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No DNS records available for this domain
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDnsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
