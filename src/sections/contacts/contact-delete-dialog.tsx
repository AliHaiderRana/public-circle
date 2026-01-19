import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

// ----------------------------------------------------------------------

interface ContactDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contactId?: string | null;
  selectedCount?: number;
}

export function ContactDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  contactId,
  selectedCount = 0,
}: ContactDeleteDialogProps) {
  const isBulkDelete = !contactId && selectedCount > 0;
  const count = isBulkDelete ? selectedCount : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Contact{count > 1 ? 's' : ''}</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete {count} contact{count > 1 ? 's' : ''}? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
