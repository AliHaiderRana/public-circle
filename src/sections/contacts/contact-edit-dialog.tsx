import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X } from 'lucide-react';
import { updateContact, type Contact } from '@/actions/contacts';
import { toast } from 'sonner';
import { formatKeyName } from './utils';

// ----------------------------------------------------------------------

interface ContactEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSuccess: () => void;
}

export function ContactEditDialog({
  open,
  onOpenChange,
  contact,
  onSuccess,
}: ContactEditDialogProps) {
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (contact) {
      setEditedContact({ ...contact });
      setChangedFields(new Set());
    }
  }, [contact, open]);

  const handleFieldChange = (key: string, value: any) => {
    if (!editedContact) return;

    setEditedContact({
      ...editedContact,
      [key]: value,
    });

    // Track changed fields
    const originalValue = contact?.[key];
    if (originalValue !== value) {
      setChangedFields((prev) => new Set(prev).add(key));
    } else {
      setChangedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleSave = async () => {
    if (!editedContact || !contact) return;

    if (changedFields.size === 0) {
      toast.info('No changes to save');
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      // Only send changed fields
      const updates: Partial<Contact> = {};
      changedFields.forEach((key) => {
        updates[key] = editedContact[key];
      });

      await updateContact(contact._id, updates);
      toast.success('Contact updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (changedFields.size > 0) {
      // Use browser confirm for now - could be replaced with a proper dialog
      const shouldCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (shouldCancel) {
        setEditedContact(contact ? { ...contact } : null);
        setChangedFields(new Set());
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  if (!contact || !editedContact) return null;

  // Get all editable fields (exclude internal fields)
  const editableFields = Object.keys(contact).filter(
    (key) =>
      !key.startsWith('_') &&
      key !== 'public_circles_company' &&
      key !== 'public_circles_is_unsubscribed'
  );

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information. Only changed fields will be saved.
            {changedFields.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {changedFields.size} change{changedFields.size > 1 ? 's' : ''}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {editableFields.map((key) => {
              const value = editedContact[key];
              const isChanged = changedFields.has(key);
              const fieldType = typeof value;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {formatKeyName(key)}
                    </Label>
                    {isChanged && (
                      <Badge variant="outline" className="text-xs">
                        Changed
                      </Badge>
                    )}
                  </div>

                  {fieldType === 'boolean' ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={value as boolean}
                        onCheckedChange={(checked) => handleFieldChange(key, checked)}
                      />
                      <Label htmlFor={key} className="text-sm font-normal">
                        {value ? 'True' : 'False'}
                      </Label>
                    </div>
                  ) : fieldType === 'object' && value !== null ? (
                    <Textarea
                      id={key}
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleFieldChange(key, parsed);
                        } catch {
                          // Invalid JSON, store as string
                          handleFieldChange(key, e.target.value);
                        }
                      }}
                      className="font-mono text-xs"
                      rows={4}
                    />
                  ) : typeof value === 'string' && value.length > 100 ? (
                    <Textarea
                      id={key}
                      value={String(value || '')}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={key}
                      value={String(value || '')}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className={isChanged ? 'border-primary' : ''}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || changedFields.size === 0}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
