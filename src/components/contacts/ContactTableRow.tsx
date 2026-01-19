import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { updateContact } from '@/actions/contacts';
import { ViewContactDialog } from './ViewContactDialog';
import { cn } from '@/lib/utils';

interface ContactTableRowProps {
  contact: any;
  visibleKeys: string[];
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onEdit: (contact: any) => void;
}

export function ContactTableRow({
  contact,
  visibleKeys,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
}: ContactTableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [openViewDialog, setOpenViewDialog] = useState(false);

  const handleSave = async () => {
    try {
      await updateContact(contact._id, editedContact);
      setIsEditing(false);
      onEdit(editedContact);
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleCancel = () => {
    setEditedContact(contact);
    setIsEditing(false);
  };

  const getCellValue = (key: string) => {
    const value = contact[key];
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return new Date(value).toLocaleDateString();
    return String(value);
  };

  const isApplePrivateRelay = (email: string) => {
    return email?.includes('privaterelay.appleid.com') || email?.includes('icloud.com');
  };

  const emailKey = visibleKeys.find((k) => k.toLowerCase().includes('email')) || 'email';
  const contactEmail = contact[emailKey];

  return (
    <TableRow 
      className={cn(
        'transition-colors cursor-pointer',
        isSelected 
          ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary' 
          : 'hover:bg-muted/50'
      )}
    >
      <TableCell className={cn(
        "w-12 sticky left-0 z-20 border-r",
        isSelected ? 'bg-primary/5' : 'bg-background'
      )}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelect}
          className="cursor-pointer"
        />
      </TableCell>
      {visibleKeys.map((key) => (
        <TableCell 
          key={key}
          className={cn(
            'max-w-[200px]',
            isSelected && 'font-medium'
          )}
        >
          {isEditing && key !== '_id' ? (
            <Input
              value={editedContact[key] || ''}
              onChange={(e) =>
                setEditedContact({ ...editedContact, [key]: e.target.value })
              }
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{getCellValue(key)}</span>
              {key === emailKey && isApplePrivateRelay(contactEmail) && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Apple Relay
                </Badge>
              )}
            </div>
          )}
        </TableCell>
      ))}
      <TableCell className={cn(
        "text-right sticky right-0 z-20 border-l",
        isSelected ? 'bg-primary/5' : 'bg-background'
      )}>
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setOpenViewDialog(true)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </TableCell>

      <ViewContactDialog
        open={openViewDialog}
        onOpenChange={setOpenViewDialog}
        contact={contact}
      />
    </TableRow>
  );
}
