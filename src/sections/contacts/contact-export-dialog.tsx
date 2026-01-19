import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getPaginatedContacts, type ContactFilter, type Contact } from '@/actions/contacts';

// ----------------------------------------------------------------------

interface ContactExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchFilters: ContactFilter[];
  selectedContacts: string[];
  totalContacts: number;
  filterOptions: {
    invalidEmailsChecked: boolean;
    unsubscribedChecked: boolean;
    applePrivateContactsChecked: boolean;
    complaintUsersChecked: boolean;
  };
}

type ExportFormat = 'csv' | 'excel';
type ExportScope = 'all' | 'selected' | 'current-page';

export function ContactExportDialog({
  open,
  onOpenChange,
  searchFilters,
  selectedContacts,
  totalContacts,
  filterOptions,
}: ContactExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let contactsToExport: Contact[] = [];

      if (exportScope === 'selected' && selectedContacts.length > 0) {
        // For selected contacts, fetch all and filter client-side
        // In production, you might want a backend endpoint for this
        toast.info(`Exporting ${selectedContacts.length} selected contacts...`);
        const allContacts = await fetchAllContactsForExport();
        contactsToExport = allContacts.filter((c) => selectedContacts.includes(c._id));
        
        if (contactsToExport.length === 0) {
          toast.error('Selected contacts not found in current filter results');
          setIsExporting(false);
          return;
        }
      } else if (exportScope === 'current-page') {
        // Export current page contacts
        const result = await getPaginatedContacts(0, 1000, searchFilters, filterOptions);
        contactsToExport = result.data;
      } else {
        // Export all contacts (with current filters)
        contactsToExport = await fetchAllContactsForExport();
      }

      if (contactsToExport.length === 0) {
        toast.error('No contacts to export');
        setIsExporting(false);
        return;
      }

      // Generate and download file
      if (exportFormat === 'csv') {
        downloadCSV(contactsToExport, includeHeaders);
      } else {
        downloadExcel(contactsToExport, includeHeaders);
      }

      toast.success(`Exported ${contactsToExport.length} contacts successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting contacts:', error);
      toast.error('Failed to export contacts');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAllContactsForExport = async (): Promise<Contact[]> => {
    const allContacts: Contact[] = [];
    let page = 0;
    const pageSize = 1000; // Large page size for export
    let hasMore = true;

    while (hasMore) {
      try {
        const result = await getPaginatedContacts(page, pageSize, searchFilters, filterOptions);
        allContacts.push(...result.data);
        hasMore = result.data.length === pageSize;
        page++;
      } catch (error) {
        console.error('Error fetching contacts for export:', error);
        break;
      }
    }

    return allContacts;
  };

  const downloadCSV = (contacts: Contact[], includeHeaders: boolean) => {
    if (contacts.length === 0) return;

    // Get all unique keys from contacts
    const allKeys = new Set<string>();
    contacts.forEach((contact) => {
      Object.keys(contact).forEach((key) => {
        if (!key.startsWith('_') && key !== 'public_circles_company') {
          allKeys.add(key);
        }
      });
    });

    const keys = Array.from(allKeys);
    const rows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      rows.push(keys.map((key) => escapeCSVValue(key)).join(','));
    }

    // Add data rows
    contacts.forEach((contact) => {
      const values = keys.map((key) => {
        const value = contact[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return escapeCSVValue(JSON.stringify(value));
        return escapeCSVValue(String(value));
      });
      rows.push(values.join(','));
    });

    // Create and download file
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = (contacts: Contact[], includeHeaders: boolean) => {
    if (contacts.length === 0) return;

    // Get all unique keys from contacts
    const allKeys = new Set<string>();
    contacts.forEach((contact) => {
      Object.keys(contact).forEach((key) => {
        if (!key.startsWith('_') && key !== 'public_circles_company') {
          allKeys.add(key);
        }
      });
    });

    const keys = Array.from(allKeys);
    const rows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      rows.push(keys.map((key) => escapeCSVValue(key)).join('\t'));
    }

    // Add data rows (Excel uses tab-separated values for better compatibility)
    contacts.forEach((contact) => {
      const values = keys.map((key) => {
        const value = contact[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return escapeCSVValue(JSON.stringify(value));
        return escapeCSVValue(String(value));
      });
      rows.push(values.join('\t'));
    });

    // Create and download file with .xlsx extension
    // Note: This creates a tab-separated file that Excel can open
    // For full Excel formatting support, consider installing 'xlsx' or 'exceljs' library
    const excelContent = rows.join('\n');
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const canExportSelected = selectedContacts.length > 0;
  const exportScopeOptions: { value: ExportScope; label: string; disabled?: boolean }[] = [
    { value: 'all', label: `All contacts (${totalContacts})` },
    {
      value: 'selected',
      label: `Selected contacts (${selectedContacts.length})`,
      disabled: !canExportSelected,
    },
    { value: 'current-page', label: 'Current page contacts' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Contacts</DialogTitle>
          <DialogDescription>
            Choose export format and options. The export will respect your current filters and
            search criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV (Comma Separated Values)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Scope */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Scope</Label>
            <RadioGroup
              value={exportScope}
              onValueChange={(value) => setExportScope(value as ExportScope)}
            >
              {exportScopeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    disabled={option.disabled}
                  />
                  <Label
                    htmlFor={option.value}
                    className={`cursor-pointer ${option.disabled ? 'text-muted-foreground' : ''}`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {!canExportSelected && exportScope === 'selected' && (
              <p className="text-sm text-muted-foreground">
                No contacts selected. Please select contacts to export.
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
              />
              <Label htmlFor="include-headers" className="cursor-pointer text-sm font-normal">
                Include column headers
              </Label>
            </div>
          </div>

          {/* Filter Info */}
          {(searchFilters.length > 0 ||
            filterOptions.invalidEmailsChecked ||
            filterOptions.unsubscribedChecked ||
            filterOptions.applePrivateContactsChecked ||
            filterOptions.complaintUsersChecked) && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-1">Active Filters:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {searchFilters.length > 0 && (
                  <li>• {searchFilters.length} search filter(s)</li>
                )}
                {filterOptions.invalidEmailsChecked && <li>• Invalid emails only</li>}
                {filterOptions.unsubscribedChecked && <li>• Unsubscribed only</li>}
                {filterOptions.applePrivateContactsChecked && <li>• Apple Private Relay only</li>}
                {filterOptions.complaintUsersChecked && <li>• Complaint users only</li>}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || (exportScope === 'selected' && !canExportSelected)}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
