import { useState } from 'react';
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
import { Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getAllVerifiedEmails,
  createEmailAddress,
  deleteEmail,
  getAllConfigurations,
  verifyDomain,
  checkDomainVerification,
  recheckDomainVerification,
  deleteDomain,
} from '@/actions/configurations';
import { AppleRelayActions } from '@/components/apple-relay/apple-relay-actions';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';
import { paths } from '@/routes/paths';

export default function EmailConfigurationPage() {
  const { verifiedEmails, isLoading: emailsLoading } = getAllVerifiedEmails();
  const { allConfigurations, isLoading: configLoading } = getAllConfigurations();
  const [newEmail, setNewEmail] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [recheckingDomain, setRecheckingDomain] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);

  const isLoading = emailsLoading || configLoading;
  
  // Combine addresses and domains into a single array (matching web repo pattern)
  const allConfigurationsCombined = [
    ...(allConfigurations?.addresses || []),
    ...(allConfigurations?.domains || []),
  ];

  const handleAddEmail = async () => {
    if (!newEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsAdding(true);
    try {
      const result = await createEmailAddress({ emailAddress: newEmail });
      if (result?.status === 200 || result?.data) {
        toast.success('Email address added successfully');
        setNewEmail('');
        setIsEmailDialogOpen(false);
        mutate(endpoints.configurations.configuration);
        mutate(endpoints.configurations.verifiedEmails);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add email');
    } finally {
      setIsAdding(false);
    }
  };

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

  const handleAddDomain = async () => {
    if (!newDomain) {
      toast.error('Please enter a domain name');
      return;
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain)) {
      toast.error('Please enter a valid domain name (e.g., example.com)');
      return;
    }

    setIsAddingDomain(true);
    try {
      const result = await verifyDomain({ emailDomain: newDomain });
      if (result?.status === 200 || result?.data) {
        toast.success('Domain added successfully. Please add the DNS records below.');
        setNewDomain('');
        setIsDomainDialogOpen(false);
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add domain');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (emailDomain: string) => {
    setVerifyingDomain(emailDomain);
    try {
      const result = await checkDomainVerification(emailDomain);
      if (result?.status === 200 || result?.data) {
        toast.success('Domain verified successfully');
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      // Error already handled in the action
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleRecheckDomain = async (emailDomain: string) => {
    setRecheckingDomain(emailDomain);
    try {
      const result = await recheckDomainVerification(emailDomain);
      if (result?.status === 200 || result?.data) {
        toast.success('DNS records refreshed. Please verify your domain.');
        mutate(endpoints.configurations.configuration);
      }
    } catch (error: any) {
      // Error already handled in the action
    } finally {
      setRecheckingDomain(null);
    }
  };

  const handleDeleteDomain = async (emailDomain: string) => {
    if (!confirm(`Are you sure you want to delete domain ${emailDomain}?`)) {
      return;
    }

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Helper to get Apple Relay status for domains
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage your verified email addresses and domains</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mutate(endpoints.configurations.configuration)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Domain</DialogTitle>
                <DialogDescription>
                  Add a domain to verify and use for sending emails
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDomainDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={isAddingDomain}>
                  {isAddingDomain ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email Address</DialogTitle>
                <DialogDescription>
                  Add a new email address to send campaigns from
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEmail} disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add Email'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Unified Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email & Domain Configurations</CardTitle>
          <CardDescription>
            Manage your verified email addresses and domains in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : allConfigurationsCombined.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No configurations found. Add an email or domain to get started.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Name</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Apple Relay</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allConfigurationsCombined.map((config: any) => {
                    const isDomain = !!config.emailDomain;
                    const isEmail = !!config.emailAddress;
                    const appleRelayStatus = isDomain ? getDomainAppleRelayStatus(config) : null;
                    const isExpanded = expandedConfigId === config._id;

                    return (
                      <>
                        <TableRow key={config._id}>
                          <TableCell className="font-medium">
                            {isDomain ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    setExpandedConfigId(isExpanded ? null : config._id)
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                {config.emailDomain}
                              </div>
                            ) : (
                              config.emailAddress
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {isDomain ? 'Domain' : 'Email'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={config.isVerified ? 'default' : 'secondary'}>
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
                                  <Badge variant="outline" className="opacity-60">
                                    No Emails
                                  </Badge>
                                ) : appleRelayStatus?.status === 'VERIFIED' ? (
                                  <Badge variant="default" className="bg-green-500">
                                    Verified ({appleRelayStatus.count})
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    Partial ({appleRelayStatus?.count}/{appleRelayStatus?.total})
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <AppleRelayActions
                                  status={config.privateRelayVerificationStatus}
                                  emailAddress={config.emailAddress}
                                  isEmailVerified={config.isVerified}
                                  onStatusChange={() => mutate(endpoints.configurations.configuration)}
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isDomain && !config.isVerified && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRecheckDomain(config.emailDomain)}
                                    disabled={recheckingDomain === config.emailDomain}
                                  >
                                    <RefreshCw
                                      className={`h-4 w-4 mr-1 ${
                                        recheckingDomain === config.emailDomain ? 'animate-spin' : ''
                                      }`}
                                    />
                                    Recheck
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleVerifyDomain(config.emailDomain)}
                                    disabled={verifyingDomain === config.emailDomain}
                                  >
                                    {verifyingDomain === config.emailDomain ? 'Verifying...' : 'Verify'}
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (isDomain) {
                                    handleDeleteDomain(config.emailDomain);
                                  } else {
                                    handleDeleteEmail(config.emailAddress);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Domain Details */}
                        {isDomain && isExpanded && (
                          <>
                            {/* DNS Records Row */}
                            {config.dnsInfo && config.dnsInfo.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="bg-muted/50">
                                  <div className="space-y-4 p-4">
                                    <div>
                                      <h4 className="font-medium mb-2">DNS Records to Add</h4>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        Add these DNS records to your domain's DNS settings to verify your domain:
                                      </p>
                                    </div>
                                    <div className="rounded-md border bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead className="w-auto sm:w-[100px]"></TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {config.dnsInfo.map((record: any, index: number) => (
                                            <TableRow key={index}>
                                              <TableCell>
                                                <Badge variant="outline">{record.Type}</Badge>
                                              </TableCell>
                                              <TableCell className="font-mono text-sm">
                                                {record.Name}
                                              </TableCell>
                                              <TableCell className="font-mono text-sm break-all">
                                                {record.Value}
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => copyToClipboard(record.Value)}
                                                >
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            {/* Domain Addresses Row */}
                            {config.addresses && config.addresses.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="bg-muted/50">
                                  <div className="space-y-4 p-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Email Addresses for {config.emailDomain}</h4>
                                    </div>
                                    <div className="rounded-md border bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Email Address</TableHead>
                                            <TableHead>From Name</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-center">Apple Relay</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {config.addresses
                                            .filter((addr: any) => addr.status === 'ACTIVE')
                                            .map((address: any) => (
                                              <TableRow key={address._id}>
                                                <TableCell className="font-medium">
                                                  {address.emailAddress}
                                                </TableCell>
                                                <TableCell>{address.fromName || '-'}</TableCell>
                                                <TableCell className="text-center">
                                                  <Badge variant={address.isVerified ? 'default' : 'secondary'}>
                                                    {address.isVerified ? 'Verified' : 'Unverified'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  <AppleRelayActions
                                                    status={address.privateRelayVerificationStatus}
                                                    emailAddress={address.emailAddress}
                                                    emailDomain={config.emailDomain}
                                                    isEmailVerified={address.isVerified}
                                                    isDomainVerified={config.isVerified}
                                                    onStatusChange={() => mutate(endpoints.configurations.configuration)}
                                                  />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteEmail(address._id || address.emailAddress)}
                                                  >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
