import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, AlertTriangle, Edit, Info } from 'lucide-react';
import {
  updateEmailKey,
  getEmailKeyRevertRequests,
  revertContactsFinalize,
  cancelRevertContactsFinalize,
  getInvalidEmailCount,
} from '@/actions/contacts';
import { getFilterKeys } from '@/actions/filters';
import { toast } from 'sonner';
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
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { Link } from 'react-router-dom';
import { paths } from '@/routes/paths';

// ----------------------------------------------------------------------

export function EmailKeyManagement() {
  const { user } = useAuthContext();
  const { emailKeyRequest } = getEmailKeyRevertRequests();
  const { InvalidEmailCount, DuplicatedCount } = getInvalidEmailCount();
  const { filterKeysData } = getFilterKeys();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isCancelRevertDialogOpen, setIsCancelRevertDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const availableKeys = filterKeysData?.data || [];
  const emailKey = user?.company?.emailKey || null;
  const isLocked = user?.company?.isContactEmailLocked;
  const hasPendingRequest = emailKeyRequest?.requestStatus === 'PENDING';

  // Filter keys to only show email-related fields
  const emailKeys = availableKeys.filter((key: string) => /email/i.test(key));

  useEffect(() => {
    if (emailKey) {
      setSelectedKey(emailKey);
    }
  }, [emailKey]);

  const handleOpenDialog = () => {
    setSelectedKey(emailKey || '');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedKey) {
      toast.error('Please select an email key');
      return;
    }

    setIsSaving(true);
    try {
      await updateEmailKey(selectedKey);
      setIsDialogOpen(false);
      setSelectedKey('');
      // Refresh user session to get updated email key
      window.location.reload();
    } catch (error) {
      console.error('Error saving email key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestRevert = async () => {
    setIsReverting(true);
    try {
      await revertContactsFinalize('EDIT_CONTACTS_EMAIL_KEY');
      toast.success('Revert request submitted successfully');
      setIsRevertDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit revert request');
    } finally {
      setIsReverting(false);
    }
  };

  const handleCancelRevert = async () => {
    setIsReverting(true);
    try {
      await cancelRevertContactsFinalize('EDIT_CONTACTS_EMAIL_KEY');
      toast.success('Revert request cancelled');
      setIsCancelRevertDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel revert request');
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Key</CardTitle>
              {InvalidEmailCount > 0 && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            {emailKey && !isLocked && (
              <Button variant="outline" size="sm" onClick={handleOpenDialog}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {emailKey && isLocked && (
              <div className="flex items-center gap-2">
                {hasPendingRequest ? (
                  <>
                    <Badge variant="secondary">Request Pending</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCancelRevertDialogOpen(true)}
                      disabled={isReverting}
                    >
                      Cancel Request
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRevertDialogOpen(true)}
                  >
                    Request Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Current Email Key:</Label>
                  <Badge variant="default">{emailKey}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  The email key is used as the primary email communication recipients for your
                  campaigns.
                </p>
                {InvalidEmailCount > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {InvalidEmailCount} contact{InvalidEmailCount > 1 ? 's have' : ' has'}{' '}
                      invalid email address{InvalidEmailCount > 1 ? 'es' : ''}.
                      {DuplicatedCount > 0 && (
                        <>
                          {' '}
                          {DuplicatedCount} duplicate{DuplicatedCount > 1 ? 's' : ''} found.
                        </>
                      )}{' '}
                      Please resolve them by changing your primary key to an email key.{' '}
                      <Link
                        to={paths.dashboard.configurations.contacts}
                        className="text-primary underline hover:no-underline"
                      >
                        Review now
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No Email key is set. Please choose a field to act as a unique identifier for your
                  contacts.
                </p>
                <Button onClick={handleOpenDialog}>
                  <Mail className="h-4 w-4 mr-2" />
                  Set Email Key
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Set/Edit Email Key Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{emailKey ? 'Edit Email Key' : 'Set Email Key'}</DialogTitle>
            <DialogDescription>
              Choose an attribute from your data to act as a unique identifier for your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-key">Email Key</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger id="email-key">
                  <SelectValue placeholder="Select a key" />
                </SelectTrigger>
                <SelectContent>
                  {emailKeys.length > 0 ? (
                    emailKeys.map((key: string) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No email fields found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedKey || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert Request Dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Edit Email Key</AlertDialogTitle>
            <AlertDialogDescription>
              The email key is locked. You need to request permission to edit it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestRevert} disabled={isReverting}>
              {isReverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Revert Request Dialog */}
      <AlertDialog open={isCancelRevertDialogOpen} onOpenChange={setIsCancelRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Revert Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the pending revert request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRevert} disabled={isReverting}>
              {isReverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
