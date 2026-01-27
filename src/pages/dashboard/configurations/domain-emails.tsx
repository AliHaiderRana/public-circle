import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
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
import { getAllConfigurations, deleteEmail, verifyAppleRelay, disablePrivateRelay } from '@/actions/configurations';
import axios from '@/lib/api';
import { endpoints } from '@/config/config';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';

// Domain email schema
const DomainEmailSchema = z.object({
  localPart: z.string().min(1, 'Email prefix is required').regex(/^[a-zA-Z0-9._%+-]+$/, 'Invalid email prefix'),
  fromName: z.string().min(1, 'From Name is required'),
});

type DomainEmailFormData = z.infer<typeof DomainEmailSchema>;

export default function DomainEmailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const domain = searchParams.get('domain');

  const { allConfigurations, isLoading } = getAllConfigurations();

  // Find the domain config
  const domainConfig = allConfigurations?.domains?.find(
    (d: any) => d.emailDomain === domain
  );

  // Dialog states
  const [isAddEmailDialogOpen, setIsAddEmailDialogOpen] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<any>(null);

  // Apple Relay states
  const [isAppleRelayModalOpen, setIsAppleRelayModalOpen] = useState(false);
  const [selectedEmailForAppleRelay, setSelectedEmailForAppleRelay] = useState<any>(null);
  const [appleRelayStep, setAppleRelayStep] = useState(0);
  const [isVerifyingAppleRelay, setIsVerifyingAppleRelay] = useState(false);
  const [disableAppleRelayOpen, setDisableAppleRelayOpen] = useState(false);
  const [emailToDisable, setEmailToDisable] = useState<any>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DomainEmailFormData>({
    resolver: zodResolver(DomainEmailSchema),
    defaultValues: {
      localPart: '',
      fromName: '',
    },
  });

  // Add email handler
  const onSubmitEmail = handleSubmit(async (data) => {
    if (!domain) return;

    setIsAddingEmail(true);
    try {
      const fullEmail = `${data.localPart}@${domain}`;
      const result = await axios.post(endpoints.configurations.addDomainEmail, {
        emailAddress: fullEmail,
        emailDomain: domain,
        fromName: data.fromName,
      });
      if (result?.status === 200 || result?.data) {
        toast.success('Email address added successfully');
        setIsAddEmailDialogOpen(false);
        reset();
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add email');
    } finally {
      setIsAddingEmail(false);
    }
  });

  // Delete email handler
  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;

    try {
      const result = await deleteEmail(emailToDelete._id || emailToDelete.emailAddress);
      if (result?.status === 200 || result?.data) {
        toast.success('Email deleted successfully');
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete email');
    }
    setDeleteDialogOpen(false);
    setEmailToDelete(null);
  };

  // Apple Relay handlers
  const handleOpenAppleRelayModal = (email: any) => {
    setSelectedEmailForAppleRelay(email);
    setIsAppleRelayModalOpen(true);
    setAppleRelayStep(0);
  };

  const handleCloseAppleRelayModal = () => {
    setIsAppleRelayModalOpen(false);
    setSelectedEmailForAppleRelay(null);
    setAppleRelayStep(0);
  };

  const handleCompleteAppleRelaySetup = async () => {
    if (!selectedEmailForAppleRelay) return;

    setIsVerifyingAppleRelay(true);
    try {
      const result = await verifyAppleRelay(selectedEmailForAppleRelay.emailAddress);
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

  const handleDisableAppleRelay = async () => {
    if (!emailToDisable) return;

    setIsDisabling(true);
    try {
      const result = await disablePrivateRelay(emailToDisable.emailAddress);
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

  // Apple Relay actions renderer
  const renderAppleRelayActions = (email: any) => {
    const status = email.privateRelayVerificationStatus;
    const isEmailVerified = email.isVerified;
    const isDomainVerified = domainConfig?.isVerified ?? true;
    const canVerify = isDomainVerified && isEmailVerified;

    if (status === 'VERIFIED') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setEmailToDisable(email);
              setDisableAppleRelayOpen(true);
            }}
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
            onClick={() => handleOpenAppleRelayModal(email)}
          >
            Re-verify
          </Button>
        </div>
      );
    }

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
              <p>Please verify domain and email first</p>
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
        onClick={() => handleOpenAppleRelayModal(email)}
      >
        Setup
      </Button>
    );
  };

  if (!domain) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No domain specified"
          description="Please select a domain from the email configuration page"
        />
        <Button onClick={() => navigate(paths.dashboard.configurations.emailConfiguration)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Email Configuration
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState variant="table" rows={5} />;
  }

  if (!domainConfig) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="Domain not found"
          description={`The domain "${domain}" was not found in your configurations`}
        />
        <Button onClick={() => navigate(paths.dashboard.configurations.emailConfiguration)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Email Configuration
        </Button>
      </div>
    );
  }

  const activeEmails = domainConfig.addresses?.filter((addr: any) => addr.status === 'ACTIVE') || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(paths.dashboard.configurations.emailConfiguration)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{domain}</h1>
            <p className="text-muted-foreground mt-1">
              Manage email addresses for this domain
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              domainConfig.isVerified
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            {domainConfig.isVerified ? 'Domain Verified' : 'Domain Unverified'}
          </Badge>
          <Button onClick={() => setIsAddEmailDialogOpen(true)} disabled={!domainConfig.isVerified}>
            <Plus className="h-4 w-4 mr-2" />
            Add Email
          </Button>
        </div>
      </div>

      {/* Emails Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Addresses</CardTitle>
          <CardDescription>
            Email addresses configured under {domain}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEmails.length === 0 ? (
            <EmptyState
              title="No email addresses"
              description="Add an email address to this domain to get started"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>From Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Apple Relay</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmails.map((email: any) => (
                    <TableRow key={email._id}>
                      <TableCell className="font-medium">{email.emailAddress}</TableCell>
                      <TableCell>{email.fromName || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            email.isVerified
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {email.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderAppleRelayActions(email)}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEmailToDelete(email);
                                  setDeleteDialogOpen(true);
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Email Dialog */}
      <Dialog open={isAddEmailDialogOpen} onOpenChange={setIsAddEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email to {domain}</DialogTitle>
            <DialogDescription>
              Add a new email address under this domain
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitEmail}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="localPart">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="localPart"
                    type="text"
                    placeholder="username"
                    {...register('localPart')}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">@{domain}</span>
                </div>
                {errors.localPart && (
                  <p className="text-sm text-destructive">{errors.localPart.message}</p>
                )}
              </div>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingEmail}>
                {isAddingEmail ? (
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Apple Relay Setup - {selectedEmailForAppleRelay?.emailAddress}
            </DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 py-4 border-b">
            {['Prerequisites', 'Register', 'Verify'].map((label, index) => (
              <button
                key={label}
                className="flex items-center"
                onClick={() => setAppleRelayStep(index)}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                    index <= appleRelayStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
                <span className={cn('ml-2 text-sm', index === appleRelayStep ? 'font-medium' : 'text-muted-foreground')}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="py-4 min-h-[200px]">
            {appleRelayStep === 0 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Before setting up Apple Relay, ensure you have:
                </p>
                <ul className="space-y-2 pl-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>An active Apple Developer account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Access to Sign in with Apple configuration</span>
                  </li>
                </ul>
              </div>
            )}

            {appleRelayStep === 1 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Register your email in Apple Developer Console:</p>
                <ol className="space-y-2 pl-4 list-decimal list-inside text-sm">
                  <li>Go to Certificates, Identifiers & Profiles</li>
                  <li>Click Services → Sign in with Apple for Email Communication</li>
                  <li>Add your email: <strong>{selectedEmailForAppleRelay?.emailAddress}</strong></li>
                  <li>Click Register</li>
                </ol>
              </div>
            )}

            {appleRelayStep === 2 && (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-primary/50 p-4 bg-primary/5">
                  <h4 className="font-semibold mb-2">Setup Complete!</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Complete Setup" to verify your Apple Relay configuration.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {appleRelayStep > 0 && (
              <Button variant="outline" onClick={() => setAppleRelayStep((s) => s - 1)}>
                Back
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleCloseAppleRelayModal}>
              Cancel
            </Button>
            {appleRelayStep < 2 ? (
              <Button onClick={() => setAppleRelayStep((s) => s + 1)}>Next</Button>
            ) : (
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
            <AlertDialogTitle>Disable Apple Relay</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable Apple Relay for{' '}
              <strong>{emailToDisable?.emailAddress}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableAppleRelay} disabled={isDisabling}>
              {isDisabling ? 'Disabling...' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Email Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{emailToDelete?.emailAddress}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmail}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
