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
import { Loader2, Key, AlertTriangle, Trash2, Edit } from 'lucide-react';
import {
  getPrimaryKey,
  createPrimaryKey,
  updatePrimaryKey,
  deletePrimaryKey,
  getPrimaryKeyEffect,
  getPrimaryKeyRevertRequests,
  revertContactsFinalize,
  cancelRevertContactsFinalize,
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

// ----------------------------------------------------------------------

export function PrimaryKeyManagement() {
  const { user } = useAuthContext();
  const { primaryKey, isLoading: isLoadingKey, mutateKey } = getPrimaryKey();
  const { primaryKeyRequest } = getPrimaryKeyRevertRequests();
  const { filterKeysData } = getFilterKeys();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isCancelRevertDialogOpen, setIsCancelRevertDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [keyEffect, setKeyEffect] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isLoadingEffect, setIsLoadingEffect] = useState(false);

  const availableKeys = filterKeysData?.data || [];
  const isLocked = user?.company?.isContactPrimaryKeyLocked;
  const hasPendingRequest = primaryKeyRequest?.requestStatus === 'PENDING';

  useEffect(() => {
    if (primaryKey) {
      setSelectedKey(primaryKey);
    }
  }, [primaryKey]);

  const handleOpenDialog = () => {
    setSelectedKey(primaryKey || '');
    setKeyEffect(null);
    setIsDialogOpen(true);
  };

  const handleKeyChange = async (value: string) => {
    setSelectedKey(value);
    setKeyEffect(null);

    // Get effect preview if total contacts <= 3000
    // Note: We'd need total contacts count, for now we'll always show effect
    setIsLoadingEffect(true);
    try {
      const result = await getPrimaryKeyEffect(value);
      if (result?.data?.message) {
        setKeyEffect(result.data.message);
      }
    } catch (error) {
      console.error('Error getting key effect:', error);
    } finally {
      setIsLoadingEffect(false);
    }
  };

  const handleSave = async () => {
    if (!selectedKey) {
      toast.error('Please select a primary key');
      return;
    }

    setIsSaving(true);
    try {
      if (primaryKey) {
        await updatePrimaryKey(selectedKey);
      } else {
        await createPrimaryKey(selectedKey);
      }
      setIsDialogOpen(false);
      setSelectedKey('');
      setKeyEffect(null);
      await mutateKey();
    } catch (error) {
      console.error('Error saving primary key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePrimaryKey();
      setIsDeleteDialogOpen(false);
      await mutateKey();
    } catch (error) {
      console.error('Error deleting primary key:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRequestRevert = async () => {
    setIsReverting(true);
    try {
      await revertContactsFinalize('EDIT_CONTACTS_PRIMARY_KEY');
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
      await cancelRevertContactsFinalize('EDIT_CONTACTS_PRIMARY_KEY');
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
              <Key className="h-5 w-5" />
              <CardTitle>Primary Key</CardTitle>
            </div>
            {primaryKey && !isLocked && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleOpenDialog}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
            {primaryKey && isLocked && (
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
          {isLoadingKey ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : primaryKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="font-medium">Current Primary Key:</Label>
                <Badge variant="default">{primaryKey}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                The primary key is used to uniquely identify contacts in your database.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No primary key is set. Please choose a field to act as a unique identifier for your
                contacts.
              </p>
              <Button onClick={handleOpenDialog}>
                <Key className="h-4 w-4 mr-2" />
                Set Primary Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set/Edit Primary Key Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{primaryKey ? 'Edit Primary Key' : 'Set Primary Key'}</DialogTitle>
            <DialogDescription>
              Choose an attribute from your data to act as a unique identifier for your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="primary-key">Primary Key</Label>
              <Select value={selectedKey} onValueChange={handleKeyChange}>
                <SelectTrigger id="primary-key">
                  <SelectValue placeholder="Select a key" />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key: string) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoadingEffect && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating effect...
              </div>
            )}

            {keyEffect && !isLoadingEffect && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{keyEffect}</AlertDescription>
              </Alert>
            )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Primary Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the primary key? This may affect how your contacts
              are identified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Request Dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Edit Primary Key</AlertDialogTitle>
            <AlertDialogDescription>
              The primary key is locked. You need to request permission to edit it.
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
