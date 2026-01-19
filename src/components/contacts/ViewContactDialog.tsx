import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Contact } from '@/actions/contacts';
import { cn } from '@/lib/utils';

interface ViewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
}

function formatKeyName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">—</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    );
  }

  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.length > 10)) {
    try {
      const date = new Date(value);
      return (
        <div className="flex flex-col">
          <span>{date.toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</span>
        </div>
      );
    } catch {
      return String(value);
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return (
      <div className="space-y-1">
        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-w-md">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">Empty array</span>;
    }
    return (
      <div className="space-y-1">
        {value.map((item, index) => (
          <Badge key={index} variant="outline" className="mr-1 mb-1">
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  if (typeof value === 'string' && value.length > 100) {
    return (
      <div className="space-y-1">
        <p className="text-sm break-words">{value.substring(0, 100)}...</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success('Full text copied to clipboard');
          }}
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy full text
        </Button>
      </div>
    );
  }

  return <span className="break-words">{String(value)}</span>;
}

export function ViewContactDialog({
  open,
  onOpenChange,
  contact,
}: ViewContactDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!contact) return null;

  const contactEntries = Object.entries(contact)
    .filter(([key]) => key !== '__v' && key !== '_id')
    .sort(([a], [b]) => {
      // Prioritize common fields
      const priority: Record<string, number> = {
        email: 1,
        name: 2,
        firstName: 3,
        lastName: 4,
        phone: 5,
        createdAt: 99,
        updatedAt: 100,
      };
      return (priority[a] || 50) - (priority[b] || 50);
    });

  const handleCopy = (key: string, value: any) => {
    const textToCopy = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textToCopy);
    setCopiedField(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
          <DialogDescription>View complete contact information</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {contactEntries.map(([key, value], index) => {
              const isImportant = ['email', 'name', 'firstName', 'lastName', 'phone'].includes(key);
              
              return (
                <div key={key} className={cn('space-y-1', index > 0 && 'pt-2 border-t')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        isImportant && 'text-foreground font-semibold'
                      )}>
                        {formatKeyName(key)}
                      </span>
                      {isImportant && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleCopy(key, value)}
                      title="Copy to clipboard"
                    >
                      {copiedField === key ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground pl-1">
                    {formatValue(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
