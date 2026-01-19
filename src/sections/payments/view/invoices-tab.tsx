import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPaidInvoices, getUpcomingInvoices, getReceipts } from '@/actions/payments';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { RefreshCw, Download, ExternalLink, FileText } from 'lucide-react';
import { format } from 'date-fns';

// ----------------------------------------------------------------------

// Helper function to safely format Unix timestamp dates
const formatDate = (timestamp: number | undefined | null): string => {
  if (!timestamp || isNaN(timestamp)) {
    return '—';
  }
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      return '—';
    }
    return format(date, 'MMM dd, yyyy');
  } catch {
    return '—';
  }
};

// ----------------------------------------------------------------------

function PaidInvoicesTab() {
  const { invoices, isLoading } = getPaidInvoices(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate('/stripe/customer-invoices');
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewInvoice = (invoiceUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank', 'width=1000,height=800');
    }
  };

  const handleDownloadInvoice = (invoicePdf?: string) => {
    if (invoicePdf) {
      window.open(invoicePdf, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoicesArray || invoicesArray.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Paid Invoices</h3>
          <p className="text-sm text-muted-foreground">You don't have any paid invoices yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Paid Invoices</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesArray.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell>
                    {formatDate(invoice.created)}
                  </TableCell>
                  <TableCell>
                    ${((invoice.amount_paid || 0) / 100).toFixed(2)} {invoice.currency?.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.invoice_pdf)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice.hosted_invoice_url)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------

function UpcomingInvoicesTab() {
  const { invoices, isLoading } = getUpcomingInvoices(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate('/stripe/customer-invoices/upcoming');
    } catch (error) {
      console.error('Error refreshing upcoming invoices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoicesArray || invoicesArray.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Upcoming Invoices</h3>
          <p className="text-sm text-muted-foreground">
            You don't have any upcoming invoices at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upcoming Invoices</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesArray.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {formatDate(invoice.period_end)}
                  </TableCell>
                  <TableCell>
                    ${((invoice.amount_due || 0) / 100).toFixed(2)} {invoice.currency?.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Upcoming</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------

function ReceiptsTab() {
  const { receipts, isLoading } = getReceipts(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Ensure receipts is always an array
  const receiptsArray = Array.isArray(receipts) ? receipts : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate('/stripe/customer-receipts');
    } catch (error) {
      console.error('Error refreshing receipts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownloadReceipt = (receiptPdf?: string) => {
    if (receiptPdf) {
      window.open(receiptPdf, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!receiptsArray || receiptsArray.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Receipts</h3>
          <p className="text-sm text-muted-foreground">You don't have any receipts yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Receipts</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receiptsArray.map((receipt: any) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-mono text-sm">{receipt.id}</TableCell>
                  <TableCell>
                    {formatDate(receipt.created)}
                  </TableCell>
                  <TableCell>
                    ${((receipt.amount_paid || 0) / 100).toFixed(2)} {receipt.currency?.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-right">
                    {receipt.receipt_pdf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(receipt.receipt_pdf)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------

export function InvoicesTab() {
  const [activeSubTab, setActiveSubTab] = useState<'paid' | 'upcoming' | 'receipts'>('paid');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant={activeSubTab === 'paid' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('paid')}
        >
          Paid Invoices
        </Button>
        <Button
          variant={activeSubTab === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('upcoming')}
        >
          Upcoming Invoices
        </Button>
        <Button
          variant={activeSubTab === 'receipts' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('receipts')}
        >
          Receipts
        </Button>
      </div>

      {activeSubTab === 'paid' && <PaidInvoicesTab />}
      {activeSubTab === 'upcoming' && <UpcomingInvoicesTab />}
      {activeSubTab === 'receipts' && <ReceiptsTab />}
    </div>
  );
}
