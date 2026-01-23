import { useState } from 'react';
import { Card } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getPaidInvoices, getUpcomingInvoices, getReceipts } from '@/actions/payments';
import { mutate } from 'swr';
import { RefreshCw, Download, FileText, Eye, Info, Receipt, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------

// Helper function to safely format Unix timestamp dates
const formatDate = (timestamp: number | string | undefined | null): string => {
  if (!timestamp) {
    return '—';
  }
  try {
    // Handle both Unix timestamp (number) and ISO date string
    const date = typeof timestamp === 'number'
      ? new Date(timestamp * 1000)
      : new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '—';
    }
    return format(date, 'MMM dd, yyyy');
  } catch {
    return '—';
  }
};

// Helper function to format time
const formatTime = (timestamp: number | string | undefined | null): string => {
  if (!timestamp) {
    return '';
  }
  try {
    const date = typeof timestamp === 'number'
      ? new Date(timestamp * 1000)
      : new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }
    return format(date, 'hh:mm a');
  } catch {
    return '';
  }
};

// Helper to get status badge variant
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'succeeded':
      return 'default';
    case 'open':
    case 'pending':
      return 'secondary';
    case 'failed':
    case 'void':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Loading skeleton for tables
const TableLoadingSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
  <TableBody>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <TableCell key={colIndex}>
            <Skeleton className="h-5 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
);

// ----------------------------------------------------------------------

function PaidInvoicesTab() {
  const { invoices, isLoading } = getPaidInvoices(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate('/stripe/customer-invoices?pageSize=10');
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewInvoice = (invoiceUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, 'InvoiceWindow', 'width=1000,height=800,left=200,top=200');
    }
  };

  const handleDownloadInvoice = (invoicePdf?: string) => {
    if (invoicePdf) {
      window.open(invoicePdf, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Please note that refunds may take 5-10 business days to appear in your account, depending on your bank's processing time.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Paid Invoices</h3>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs sm:text-sm font-semibold">Created At</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Description</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Total Cost</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Status</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading || isRefreshing ? (
              <TableLoadingSkeleton rows={5} columns={5} />
            ) : invoicesArray.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No paid invoices yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {invoicesArray.map((invoice: any) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(invoice.createdAt || invoice.created)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(invoice.createdAt || invoice.created)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {invoice.description ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {invoice.description.split(',').filter((item: string) => item.trim()).map((item: string, index: number) => (
                            <li key={index} className="text-muted-foreground">
                              {item.trim()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      ${(invoice.totalCost || (invoice.amount_paid || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <Badge
                        variant={getStatusVariant(invoice.status)}
                        className={cn(
                          invoice.status === 'paid' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                          invoice.status === 'open' && 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        )}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-center">
                      <TooltipProvider>
                        <div className="flex items-center justify-center gap-1">
                          {(invoice.hostedInvoiceUrl || invoice.hosted_invoice_url) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewInvoice(invoice.hostedInvoiceUrl || invoice.hosted_invoice_url)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Invoice</TooltipContent>
                            </Tooltip>
                          )}
                          {(invoice.invoicePdf || invoice.invoice_pdf) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDownloadInvoice(invoice.invoicePdf || invoice.invoice_pdf)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------

function UpcomingInvoicesTab() {
  const { invoices, isLoading } = getUpcomingInvoices(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle both single invoice object and array
  const invoicesArray = invoices
    ? Array.isArray(invoices)
      ? invoices
      : [invoices]
    : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate('/stripe/customer-invoices/upcoming?pageSize=10');
    } catch (error) {
      console.error('Error refreshing upcoming invoices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Upcoming Invoices</h3>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs sm:text-sm font-semibold">Created At</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Description</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Total Due</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading || isRefreshing ? (
              <TableLoadingSkeleton rows={3} columns={4} />
            ) : invoicesArray.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No upcoming invoices</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {invoicesArray.map((invoice: any, index: number) => (
                  <TableRow key={invoice.id || index} className="hover:bg-muted/30">
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(invoice.createdAt || invoice.period_end)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(invoice.createdAt || invoice.period_end)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {invoice.description ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {invoice.description.split(',').filter((item: string) => item.trim()).map((item: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">
                              {item.trim()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      ${(invoice.costDue || (invoice.amount_due || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <Badge
                        variant={getStatusVariant(invoice.status)}
                        className={cn(
                          invoice.status === 'paid' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                          invoice.status === 'open' && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                          invoice.status === 'draft' && 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {invoice.status || 'Upcoming'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
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
      await mutate('/stripe/customer-receipts?pageSize=10');
    } catch (error) {
      console.error('Error refreshing receipts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewReceipt = (receiptUrl?: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, 'ReceiptWindow', 'width=1000,height=800,left=200,top=200');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Receipts</h3>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs sm:text-sm font-semibold">Created At</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Description</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Amount</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold">Status</TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading || isRefreshing ? (
              <TableLoadingSkeleton rows={5} columns={5} />
            ) : receiptsArray.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No receipts yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {receiptsArray.map((receipt: any) => (
                  <TableRow key={receipt.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(receipt.createdAt || receipt.created)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(receipt.createdAt || receipt.created)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        {receipt.description || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      ${(receipt.amount || (receipt.amount_paid || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <Badge
                        variant={getStatusVariant(receipt.status)}
                        className={cn(
                          receipt.status === 'succeeded' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                          receipt.status === 'open' && 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        )}
                      >
                        {receipt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-right">
                      <TooltipProvider>
                        {(receipt.receiptUrl || receipt.receipt_url) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleViewReceipt(receipt.receiptUrl || receipt.receipt_url)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Receipt</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------

export function InvoicesTab() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="paid" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="h-4 w-4 hidden sm:inline-block" />
            Paid Invoices
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4 hidden sm:inline-block" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="receipts" className="gap-2">
            <Receipt className="h-4 w-4 hidden sm:inline-block" />
            Receipts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="mt-6">
          <PaidInvoicesTab />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <UpcomingInvoicesTab />
        </TabsContent>

        <TabsContent value="receipts" className="mt-6">
          <ReceiptsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
