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
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import {
  getPrimaryKey,
  createPrimaryKey,
  updatePrimaryKey,
  deletePrimaryKey,
  getPrimaryKeyEffect,
  getFilterKeys,
  getPrimaryKeyRevertRequests,
  revertContactsFinalize,
  cancelRevertContactsFinalize,
} from '@/actions/contacts';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface PrimaryKeyManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function PrimaryKeyManagement({
  open,
  onOpenChange,
  onUpdate,
}: PrimaryKeyManagementProps) {
  const { user, checkUserSession } = useAuthContext();
  const [selectedKey, setSelectedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [effectPreview, setEffectPreview] = useState<any>(null);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isCancelRevertDialogOpen, setIsCancelRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const { filterKeys } = getFilterKeys();
  const { primaryKey: currentKey, isLoading: isLoadingKey } = getPrimaryKey();
  const { primaryKeyRequest } = getPrimaryKeyRevertRequests();

  const isLocked = user?.company?.isContactPrimaryKeyLocked;
  const hasPendingRequest = primaryKeyRequest?.requestStatus === 'PENDING';

  useEffect(() => {
    if (open && currentKey) {
      setSelectedKey(currentKey);
    }
  }, [open, currentKey]);

  const handlePreview = async () => {
    if (!selectedKey) return;
    setIsLoading(true);
    try {
      const response = await getPrimaryKeyEffect(selectedKey);
      if (response?.status === 200) {
        setEffectPreview(response.data?.data);
      }
    } catch (error) {
      console.error('Error fetching effect preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedKey) {
      toast.error('Please select a primary key');
      return;
    }
    setIsLoading(true);
    try {
      if (currentKey) {
        await updatePrimaryKey(selectedKey);
      } else {
        await createPrimaryKey(selectedKey);
      }
      onUpdate();
      onOpenChange(false);
      await checkUserSession?.();
    } catch (error) {
      console.error('Error saving primary key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRevert = async () => {
    setIsReverting(true);
    try {
      await revertContactsFinalize('EDIT_CONTACTS_PRIMARY_KEY');
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
      await cancelRevertContactsFinalize('EDIT_CONTACTS_PRIMARY_KEY');
      toast.success('Revert request cancelled');
      setIsCancelRevertDialogOpen(false);
      await checkUserSession?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel revert request');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deletePrimaryKey();
      setCurrentKey('');
      setSelectedKey('');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting primary key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Primary Key Management</DialogTitle>
          <DialogDescription>
            Select a field to act as the primary key for your contacts
          </DialogDescription>
        </DialogHeader>

        {isLoadingKey ? (
          <LoadingState />
        ) : (
          <div className="space-y-4">
            {/* Current Primary Key Display */}
            {currentKey && (
              <div className="flex items-center gap-2">
                <Label>Current Primary Key:</Label>
                <span className="text-sm font-medium">{currentKey}</span>
              </div>
            )}

            {/* Select Primary Key - Only show when NOT locked */}
            {!isLocked && (
              <div className="space-y-2">
                <Label htmlFor="primary-key">Select Primary Key</Label>
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger id="primary-key">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterKeys.map((key: string) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Effect Preview - Only show when NOT locked and key changed */}
            {!isLocked && selectedKey && selectedKey !== currentKey && (
              <div className="space-y-2">
                <Button variant="outline" onClick={handlePreview} disabled={isLoading}>
                  Preview Effect
                </Button>
                {effectPreview && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <p className="text-sm font-medium mb-2">Effect Preview</p>
                    <p className="text-sm text-muted-foreground">
                      This will affect {effectPreview.affectedCount || 0} contacts
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Locked State Warning */}
            {isLocked && !hasPendingRequest && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-600">
                      Primary key is locked
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Request a revert to make changes
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Request Badge */}
            {hasPendingRequest && (
              <div className="rounded-lg border border-gray-500/50 bg-gray-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Revert request pending</p>
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
              {currentKey && !isLocked && (
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                  Delete Primary Key
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {!isLocked && (
                <Button
                  onClick={handleSave}
                  disabled={!selectedKey || isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>

      {/* Revert Request Dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Revert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request to revert finalized contacts? This will allow
              editing the primary key.
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
