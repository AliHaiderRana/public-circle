import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingButton } from '@/components/ui/loading-button';
import { getCustomerBalance, createTopUp, getOverageConsumption, type OverageConsumption } from '@/actions/payments';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Plus, RefreshCw, DollarSign, TrendingUp, Download } from 'lucide-react';
import { format } from 'date-fns';
import { downloadCSV, downloadExcel } from '@/utils/export-utils';

// ----------------------------------------------------------------------

export function OverageTab() {
  const { balance, isLoading } = getCustomerBalance();
  const { overageConsumption, isLoading: isLoadingOverage } = getOverageConsumption();
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate('/stripe/customer-balance');
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await createTopUp(amount);
      setTopUpDialogOpen(false);
      setTopUpAmount('');
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportOverage = async (format: 'csv' | 'excel' = 'csv') => {
    if (!overageConsumption || overageConsumption.length === 0) {
      toast.error('No overage consumption data to export');
      return;
    }

    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = overageConsumption.map((item: OverageConsumption) => ({
        Date: item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
        Type: item.kind || '',
        Overage: item.overage || 0,
        'Overage Charge': item.overageCharge || 0,
        Description: item.description || '',
        'Invoice Item ID': item.stripeInvoiceItemId || '',
      }));

      const headers = ['Date', 'Type', 'Overage', 'Overage Charge', 'Description', 'Invoice Item ID'];
      const filename = `overage-consumption_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      if (format === 'csv') {
        downloadCSV(exportData, headers, filename, true);
      } else {
        downloadExcel(exportData, headers, filename, true);
      }

      toast.success(`Exported ${exportData.length} overage records successfully`);
    } catch (error) {
      console.error('Error exporting overage data:', error);
      toast.error('Failed to export overage data');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const balanceAmount = balance?.balance ? Math.abs(balance.balance) / 100 : 0;
  const currency = balance?.currency?.toUpperCase() || 'USD';

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Balance</CardTitle>
              <CardDescription>Your current account balance and top-up history</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setTopUpDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Top Up
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold mt-1">
                {currency} {balanceAmount.toFixed(2)}
              </p>
              {balance?.available !== undefined && (
                <p className="text-sm text-muted-foreground mt-1">
                  Available: {currency} {(Math.abs(balance.available) / 100).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overage Consumption (if available) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overage Consumption</CardTitle>
              <CardDescription>
                Track your usage beyond your plan limits
              </CardDescription>
            </div>
            {overageConsumption && overageConsumption.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportOverage('csv')}
                  disabled={isExporting || isLoadingOverage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportOverage('excel')}
                  disabled={isExporting || isLoadingOverage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingOverage ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : overageConsumption && overageConsumption.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Overage</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overageConsumption.map((item: OverageConsumption) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        {item.createdAt
                          ? format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{item.kind || '—'}</TableCell>
                      <TableCell>{item.overage?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        {item.overageCharge
                          ? `$${item.overageCharge.toFixed(2)}`
                          : '$0.00'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No overage consumption data available</p>
              <p className="text-sm mt-2">
                Overage consumption will appear here when you exceed your plan limits
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Balance</DialogTitle>
            <DialogDescription>
              Add funds to your account balance. The amount will be charged to your default payment
              method.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount you want to add to your balance
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpDialogOpen(false)}>
              Cancel
            </Button>
            <LoadingButton onClick={handleTopUp} loading={isProcessing} disabled={!topUpAmount}>
              Add Funds
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
