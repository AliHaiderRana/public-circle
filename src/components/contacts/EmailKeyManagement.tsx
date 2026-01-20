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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  getFilterKeys,
  updateEmailKey,
  getEmailKeyRevertRequests,
  revertContactsFinalize,
  cancelRevertContactsFinalize,
} from '@/actions/contacts';
import { toast } from 'sonner';
import { useAuthContext } from '@/auth/hooks/use-auth-context';

interface EmailKeyManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invalidEmailCount: number;
}

export function EmailKeyManagement({
  open,
  onOpenChange,
  invalidEmailCount,
}: EmailKeyManagementProps) {
  const { user, checkUserSession } = useAuthContext();
  const { filterKeys } = getFilterKeys();
  const { emailKeyRequest } = getEmailKeyRevertRequests();
  const [selectedKey, setSelectedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isCancelRevertDialogOpen, setIsCancelRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const emailKeys = filterKeys.filter((key: string) =>
    key.toLowerCase().includes('email')
  );

  const currentEmailKey = user?.company?.emailKey;
  const isLocked = user?.company?.isContactEmailLocked;
  const hasPendingRequest = emailKeyRequest?.requestStatus === 'PENDING';

  useEffect(() => {
    if (open && currentEmailKey) {
      setSelectedKey(currentEmailKey);
    }
  }, [open, currentEmailKey]);

  const handleSave = async () => {
    if (!selectedKey) {
      toast.error('Please select an email key');
      return;
    }
    setIsLoading(true);
    try {
      await updateEmailKey(selectedKey);
      onOpenChange(false);
      await checkUserSession?.();
    } catch (error) {
      console.error('Error updating email key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRevert = async () => {
    setIsReverting(true);
    try {
      await revertContactsFinalize('EDIT_CONTACTS_EMAIL_KEY');
      toast.success('Revert request submitted successfully');
      setIsRevertDialogOpen(false);
      await checkUserSession?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit revert request');
    } finally {
      setIsReverting(false);
    }
  };

  const handleCancelRevert = async () => {
    setIsCanceling(true);
    try {
      await cancelRevertContactsFinalize('EDIT_CONTACTS_EMAIL_KEY');
      toast.success('Revert request cancelled');
      setIsCancelRevertDialogOpen(false);
      await checkUserSession?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel revert request');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Key Management</DialogTitle>
          <DialogDescription>
            Select a field to act as the email identifier for your contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Email Key Display */}
          {currentEmailKey && (
            <div className="flex items-center gap-2">
              <Label>Current Email Key:</Label>
              <span className="text-sm font-medium">{currentEmailKey}</span>
            </div>
          )}

          {/* Invalid Email Warning */}
          {invalidEmailCount > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {invalidEmailCount} invalid email{invalidEmailCount > 1 ? 's' : ''} detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please resolve them by changing your primary key to an email key.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Select Email Key - Only show when NOT locked */}
          {!isLocked && (
            <div className="space-y-2">
              <Label htmlFor="email-key">Select Email Key</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger id="email-key">
                  <SelectValue placeholder="Select email field" />
                </SelectTrigger>
                <SelectContent>
                  {emailKeys.map((key: string) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Locked State Warning */}
          {isLocked && !hasPendingRequest && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Email key is locked</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Request a revert to make changes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Request Badge */}
          {hasPendingRequest && (
            <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-600">Revert request pending</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Waiting for approval
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelRevertDialogOpen(true)}
                  disabled={isCanceling}
                >
                  Cancel Request
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {isLocked && !hasPendingRequest && (
              <Button
                variant="outline"
                onClick={() => setIsRevertDialogOpen(true)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Request Revert
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {!isLocked && (
              <Button onClick={handleSave} disabled={!selectedKey || isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>

      {/* Revert Request Dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Revert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request to revert finalized contacts? This will allow
              editing the email key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestRevert} disabled={isReverting}>
              {isReverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Revert Request Dialog */}
      <AlertDialog
        open={isCancelRevertDialogOpen}
        onOpenChange={setIsCancelRevertDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Revert Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the pending revert request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRevert}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
