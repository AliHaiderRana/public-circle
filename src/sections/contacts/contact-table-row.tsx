import { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Eye, Edit, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { type Contact } from '@/actions/contacts';
import { isApplePrivateRelayEmail, formatKeyName } from './utils';
import { ContactEditDialog } from './contact-edit-dialog';
import { ViewContactDialog } from '@/components/contacts/ViewContactDialog';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';

// ----------------------------------------------------------------------

interface ContactTableRowProps {
  contact: Contact;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  visibleKeys: string[];
}

export function ContactTableRow({
  contact,
  selected,
  onSelect,
  onDelete,
  visibleKeys,
}: ContactTableRowProps) {
  const navigate = useNavigate();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleView = () => {
    setViewDialogOpen(true);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh will be handled by parent component
    window.location.reload();
  };

  return (
    <>
      <TableRow className={selected ? 'bg-muted/50' : ''}>
        <TableCell className={`sticky left-0 z-10 border-r ${selected ? 'bg-muted/50' : 'bg-background'}`}>
          <Checkbox checked={selected} onCheckedChange={onSelect} />
        </TableCell>
        {visibleKeys.map((key) => {
          const cellValue = contact[key];
          const isBool = typeof cellValue === 'boolean';
          const isString = typeof cellValue === 'string';
          const isAppleRelay = isString && isApplePrivateRelayEmail(cellValue);

          return (
            <TableCell key={key} className="whitespace-nowrap">
              <div className="flex items-center gap-2">
                {isBool ? (
                  <Badge variant={cellValue ? 'default' : 'secondary'}>
                    {cellValue ? 'True' : 'False'}
                  </Badge>
                ) : isAppleRelay ? (
                  <>
                    <span>{cellValue}</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </>
                ) : typeof cellValue === 'object' && cellValue !== null ? (
                  <span className="text-xs text-muted-foreground">
                    {JSON.stringify(cellValue)}
                  </span>
                ) : (
                  <span>{cellValue || '-'}</span>
                )}
              </div>
            </TableCell>
          );
        })}
        <TableCell className={`sticky right-0 z-10 border-l ${selected ? 'bg-muted/50' : 'bg-background'}`}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* View Dialog */}
      <ViewContactDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        contact={contact}
      />

      {/* Edit Dialog */}
      <ContactEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={contact}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
