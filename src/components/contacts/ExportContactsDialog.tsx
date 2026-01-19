import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/lib/api';
import type { ContactFilter } from '@/actions/contacts';

interface ExportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ContactFilter[];
  totalCount: number;
  options?: {
    isUnSubscribed?: boolean;
    isInvalidEmail?: boolean;
    isPrivateRelayEmail?: boolean;
    unSubscribedReason?: string;
  };
}

export function ExportContactsDialog({
  open,
  onOpenChange,
  filters,
  totalCount,
  options = {},
}: ExportContactsDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const formattedFilters = filters
        .filter((filter) => filter.filterKey !== null && filter.filterKey !== '')
        .map((filter) => ({
          filterKey: filter.filterKey!,
          filterValues: filter.filterValues || [],
        }));

      const params = {
        filters: formattedFilters,
        format: exportFormat,
        includeHeaders,
        ...options,
      };

      const response = await axios.post('/company-contacts/export', params, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `contacts-export-${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${totalCount.toLocaleString()} contacts successfully`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error exporting contacts:', error);
      toast.error(error?.message || 'Failed to export contacts');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Contacts</DialogTitle>
          <DialogDescription>
            Export {totalCount.toLocaleString()} contact{totalCount !== 1 ? 's' : ''} to a file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="csv"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                  className="h-4 w-4"
                />
                <Label htmlFor="csv" className="cursor-pointer">
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="excel"
                  name="format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel')}
                  className="h-4 w-4"
                />
                <Label htmlFor="excel" className="cursor-pointer">
                  Excel
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-headers"
              checked={includeHeaders}
              onCheckedChange={setIncludeHeaders}
            />
            <Label htmlFor="include-headers" className="cursor-pointer">
              Include column headers
            </Label>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              The export will include all contacts matching your current filters and search
              criteria.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
