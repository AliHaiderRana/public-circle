/**
 * UnsavedChangesDialog Component
 * Confirmation dialog when user tries to exit with unsaved changes
 */

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

export interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
