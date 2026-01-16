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
import { Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Copy } from 'lucide-react';
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
import { toast } from 'sonner';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';

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

  const isLoading = emailsLoading || configLoading;
  const domains = allConfigurations?.emailConfigurations?.domains || [];

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
        mutate(endpoints.configurations.verifiedEmails);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add email');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      const result = await deleteEmail(emailId);
      if (result?.status === 200 || result?.data) {
        toast.success('Email deleted successfully');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage your verified email addresses and domains</p>
        </div>
        <div className="flex gap-2">
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

      {/* Domains Section */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Domains</CardTitle>
          <CardDescription>
            Manage your verified domains and DNS records for email sending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No domains found. Add a domain to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DNS Records</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain: any) => (
                    <>
                      <TableRow key={domain.emailDomain}>
                        <TableCell className="font-medium">{domain.emailDomain}</TableCell>
                        <TableCell>
                          <Badge variant={domain.isVerified ? 'default' : 'secondary'}>
                            {domain.isVerified ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {domain.dnsInfo && domain.dnsInfo.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedDomain(
                                  expandedDomain === domain.emailDomain ? null : domain.emailDomain
                                )
                              }
                            >
                              {expandedDomain === domain.emailDomain ? 'Hide' : 'Show'} DNS Records
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">No DNS records</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!domain.isVerified && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRecheckDomain(domain.emailDomain)}
                                  disabled={recheckingDomain === domain.emailDomain}
                                >
                                  <RefreshCw
                                    className={`h-4 w-4 mr-1 ${
                                      recheckingDomain === domain.emailDomain ? 'animate-spin' : ''
                                    }`}
                                  />
                                  Recheck
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleVerifyDomain(domain.emailDomain)}
                                  disabled={verifyingDomain === domain.emailDomain}
                                >
                                  {verifyingDomain === domain.emailDomain ? 'Verifying...' : 'Verify'}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDomain(domain.emailDomain)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedDomain === domain.emailDomain && domain.dnsInfo && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/50">
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
                                      <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {domain.dnsInfo.map((record: any, index: number) => (
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
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Addresses Section */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Email Addresses</CardTitle>
          <CardDescription>
            These email addresses are verified and can be used to send campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : !Array.isArray(verifiedEmails) || verifiedEmails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No verified emails found. Add an email address to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(verifiedEmails) ? verifiedEmails : []).map((email: any) => (
                <div
                  key={email._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{email.emailAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {email.verified ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEmail(email._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
