import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Edit, Trash2, AlertTriangle, CheckCircle, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { updateContact } from '@/actions/contacts';
import { ViewContactDialog } from './ViewContactDialog';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';

interface ContactTableRowProps {
  contact: any;
  visibleKeys: string[];
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  onEdit: (contact: any) => void;
  isAppleRelayVerified?: boolean;
}

export function ContactTableRow({
  contact,
  visibleKeys,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  isAppleRelayVerified = false,
}: ContactTableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [displayContact, setDisplayContact] = useState(contact);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const navigate = useNavigate();

  // Sync with prop when it changes from parent
  useEffect(() => {
    setEditedContact(contact);
    setDisplayContact(contact);
  }, [contact]);

  const handleSave = async () => {
    try {
      await updateContact(contact._id, editedContact);
      setDisplayContact(editedContact); // Update display immediately
      setIsEditing(false);
      onEdit(editedContact);
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleCancel = () => {
    setEditedContact(displayContact);
    setIsEditing(false);
  };

  const getCellValue = (key: string) => {
    const value = displayContact[key];
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return new Date(value).toLocaleDateString();
    return String(value);
  };

  const isApplePrivateRelay = (email: string) => {
    return email && /@privaterelay\.appleid\.com\s*$/i.test(email.trim());
  };

  const emailKey = visibleKeys.find((k) => k.toLowerCase().includes('email')) || 'email';
  const contactEmail = displayContact[emailKey];

  const handleNavigateToConfig = () => {
    navigate(`${paths.dashboard.configurations.emailConfiguration}?setupApple=true`);
  };

  return (
    <TableRow
      className={cn(
        'transition-colors cursor-pointer',
        isSelected
          ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary'
          : 'hover:bg-muted/50'
      )}
    >
      <TableCell className="w-12">
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
              {key === emailKey && isApplePrivateRelay(contactEmail) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {isAppleRelayVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px]">
                      {isAppleRelayVerified ? (
                        <p className="text-sm">
                          You have set up sending to Apple Private Relay addresses. The system is configured to handle these addresses.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm">
                            You have not fully set up to send emails to Apple Private Relay addresses. This email may be considered invalid for delivery.
                          </p>
                          <Button size="sm" variant="secondary" onClick={handleNavigateToConfig}>
                            Configure
                          </Button>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="truncate">{getCellValue(key)}</span>
            </div>
          )}
        </TableCell>
      ))}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save changes</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setOpenViewDialog(true)} className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View details</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </TableCell>

      <ViewContactDialog
        open={openViewDialog}
        onOpenChange={setOpenViewDialog}
        contact={displayContact}
      />
    </TableRow>
  );
}
