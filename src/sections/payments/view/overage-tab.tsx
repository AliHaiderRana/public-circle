import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  getCustomerBalance,
  createTopUp,
  getQuotaDetails,
  getCampaignUsageDetails,
  getTestEmailUsageDetails,
  getDefaultPaymentMethod,
} from '@/actions/payments';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { mutate } from 'swr';
import { toast } from 'sonner';
import {
  RefreshCw,
  DollarSign,
  Wallet,
  HardDrive,
  Mail,
  Eye,
  CheckCircle2,
  Plus,
  TrendingUp,
  Sparkles,
  CreditCard,
  ArrowUpRight,
  Zap,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { paths } from '@/routes/paths';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------

export function OverageTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (tab: string) => {
    setIsRefreshing(true);
    try {
      if (tab === 'balance') {
        await mutate('/stripe/customer-balance');
      } else {
        await mutate('/campaigns/usage-details');
        await mutate('/campaigns/test-usage-detail');
        await mutate('/stripe/quota-details');
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Tabs defaultValue="balance" className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="balance" className="text-xs sm:text-sm px-4 sm:px-6">
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Balance
          </TabsTrigger>
          <TabsTrigger value="consumption" className="text-xs sm:text-sm px-4 sm:px-6">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Consumption
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="balance" className="space-y-4 sm:space-y-6 mt-0">
        <BalanceTab onRefresh={() => handleRefresh('balance')} isRefreshing={isRefreshing} />
      </TabsContent>

      <TabsContent value="consumption" className="space-y-4 sm:space-y-6 mt-0">
        <ConsumptionTab onRefresh={() => handleRefresh('consumption')} isRefreshing={isRefreshing} />
      </TabsContent>
    </Tabs>
  );
}

// ----------------------------------------------------------------------
// Balance Tab Component
// ----------------------------------------------------------------------

interface BalanceTabProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

function BalanceTab({ onRefresh, isRefreshing }: BalanceTabProps) {
  const { balance, isLoading } = getCustomerBalance();
  const { paymentMethod } = getDefaultPaymentMethod();
  const { user } = useAuthContext();
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState('');

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleTopUpClick = (amount?: number) => {
    const finalAmount = amount ? amount.toString() : topUpAmount;
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setTopUpAmount(finalAmount);
    setTopUpDialogOpen(true);
    setShowSuccess(false);
  };

  const handleClose = () => {
    setTopUpDialogOpen(false);
    setTimeout(() => {
      setShowSuccess(false);
      setTopUpAmount('');
    }, 300);
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
      setSuccessAmount(topUpAmount);
      setShowSuccess(true);
    } catch (error) {
      // Error is handled in the action
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  // balance is returned directly as a number from the API (in dollars, not cents)
  const balanceAmount = typeof balance === 'number' ? Math.abs(balance) : 0;

  return (
    <>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Balance Card - Centered Design */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-100 via-slate-50 to-white shadow-lg">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/50 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-200/50 rounded-full translate-y-12 -translate-x-12" />

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="absolute top-3 right-3 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 z-20"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col items-center justify-center text-center min-h-[200px]">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-4 shadow-lg">
              <Wallet className="h-7 w-7 text-white" />
            </div>

            {/* Label */}
            <p className="text-slate-600 font-semibold text-base mb-4">Current Balance</p>

            {/* Balance Amount Box */}
            <div className="w-full px-4 py-5 rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 shadow-lg">
              <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                ${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Description */}
            <p className="text-slate-500 text-sm mt-4">Available for services</p>
          </CardContent>
        </Card>

        {/* Quick Top Up Card */}
        <Card className="lg:col-span-2 border-2 hover:border-primary/30 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Quick Top Up
                </CardTitle>
                <CardDescription>Select an amount or enter a custom value</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Instant
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {quickAmounts.map((amount) => (
                <Card
                  key={amount}
                  onClick={() => handleTopUpClick(amount)}
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-2 hover:border-primary/50"
                >
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      ${amount.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter custom amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              <Button
                onClick={() => handleTopUpClick()}
                disabled={!topUpAmount}
                className="h-11 px-6"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Top Up
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Secure payment processing - Funds available immediately
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top-Up Confirmation Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          {showSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Funds Added Successfully!</h3>
              <p className="text-muted-foreground mb-4">
                ${successAmount} has been added to your balance
              </p>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  Confirm Top Up
                </DialogTitle>
                <DialogDescription>
                  Review and confirm your payment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Amount Display */}
                <div className="text-center p-6 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Amount to add</p>
                  <p className="text-4xl font-bold text-primary">
                    ${parseFloat(topUpAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Payment Method Preview */}
                {paymentMethod?.card && (
                  <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Payment Method</span>
                        <CreditCard className="h-5 w-5 text-white/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-mono text-lg tracking-wider">
                          •••• •••• •••• {paymentMethod.card.last4}
                        </p>
                        <div className="flex items-center justify-between text-sm text-white/70">
                          <span>{user?.firstName} {user?.lastName}</span>
                          <span>{paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleTopUp}
                  loading={isProcessing}
                >
                  Confirm Payment
                </LoadingButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ----------------------------------------------------------------------
// Consumption Tab Component
// ----------------------------------------------------------------------

interface ConsumptionTabProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

function ConsumptionTab({ onRefresh, isRefreshing }: ConsumptionTabProps) {
  const { quotaDetails, isLoading: isLoadingQuota } = getQuotaDetails();
  const { campaignUsage, isLoading: isLoadingCampaign } = getCampaignUsageDetails();
  const { testEmailUsage, isLoading: isLoadingTest } = getTestEmailUsageDetails();
  const navigate = useNavigate();

  if (isLoadingQuota) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const bandwidthPercent = quotaDetails?.overageConsumptionInPercentageBandwidth || 0;
  const emailPercent = quotaDetails?.overageConsumptionInPercentageEmails || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Usage Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        {/* Bandwidth Usage Card */}
        <Card className="border-2 hover:border-gray-200 transition-colors overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <HardDrive className="h-4 w-4 text-gray-600" />
                </div>
                Bandwidth Usage
              </CardTitle>
              <Badge variant={bandwidthPercent > 80 ? "destructive" : bandwidthPercent > 50 ? "secondary" : "default"}>
                {bandwidthPercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Usage Progress</span>
                <span className="font-medium">{bandwidthPercent}%</span>
              </div>
              <Progress value={bandwidthPercent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Plan Limit</p>
                <p className="font-semibold">
                  {quotaDetails?.bandwidthAllowedInPlan?.toLocaleString() || 0}{' '}
                  {quotaDetails?.bandwidthAllowedInPlanUnit || 'KB'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Consumed</p>
                <p className="font-semibold">
                  {quotaDetails?.bandwidthConsumedInPlan?.toLocaleString() || 0}{' '}
                  {quotaDetails?.bandwidthConsumedInPlanUnit || 'KB'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Overage</p>
                <p className="font-semibold text-foreground">
                  {quotaDetails?.bandwidthConsumedInOverage?.toLocaleString() || 0}{' '}
                  {quotaDetails?.bandwidthConsumedInOverageUnit || 'KB'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Overage Cost</p>
                <p className="font-semibold text-foreground">
                  ${quotaDetails?.bandwidthConsumedInOveragePrice?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Usage Card */}
        <Card className="border-2 hover:border-gray-200 transition-colors overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                Email Usage
              </CardTitle>
              <Badge variant={emailPercent > 80 ? "destructive" : emailPercent > 50 ? "secondary" : "default"}>
                {emailPercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Usage Progress</span>
                <span className="font-medium">{emailPercent}%</span>
              </div>
              <Progress value={emailPercent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Plan Limit</p>
                <p className="font-semibold">
                  {quotaDetails?.emailsAllowedInPlan?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Consumed</p>
                <p className="font-semibold">
                  {quotaDetails?.emailsConsumedInPlan?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Overage</p>
                <p className="font-semibold text-foreground">
                  {quotaDetails?.emailsConsumedInOverage?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Overage Cost</p>
                <p className="font-semibold text-foreground">
                  ${quotaDetails?.emailsConsumedInOveragePrice?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Usage Table */}
      {campaignUsage && campaignUsage.length > 0 && (
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Campaign Usage
              </CardTitle>
              <Badge variant="outline">{campaignUsage.length} campaigns</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs sm:text-sm font-semibold">Campaign</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Emails</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden sm:table-cell">CC/BCC</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden md:table-cell">Bandwidth</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Cost</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignUsage.map((item: any) => (
                    <TableRow key={item.campaignId} className="hover:bg-muted/30">
                      <TableCell className="text-xs sm:text-sm font-medium max-w-[150px] truncate">
                        {item.emailSubject || 'Campaign Name'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="secondary">{item.emailUsage}</Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                        {item.ccBccEmailUsage ?? '-'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                        {`${item.bandwidthUsage} ${item.bandwidthUsageUnit}`}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="cursor-help">
                                ${((item?.overagePrice?.email || 0) + (item?.overagePrice?.bandwidth || 0)).toFixed(2)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 text-xs">
                                <p>Email: ${item?.overagePrice?.email?.toFixed(2) || 0}</p>
                                <p>Bandwidth: ${item?.overagePrice?.bandwidth?.toFixed(2) || 0}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            navigate(paths.dashboard.logs?.detail || '/dashboard/logs', {
                              state: {
                                campaignId: item?.campaignId,
                                campaignName: item?.emailSubject || 'Campaign Name',
                              },
                            });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Emails Table */}
      {testEmailUsage && testEmailUsage.length > 0 && (
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-600" />
                Test Email Usage
              </CardTitle>
              <Badge variant="outline">{testEmailUsage.length} records</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs sm:text-sm font-semibold">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Emails</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden sm:table-cell">Bandwidth</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testEmailUsage.map((item: any, index: number) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="text-xs sm:text-sm">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="secondary">{item.emailCount}</Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                        {`${item.totalBandwidth} ${item.bandwidthUsageUnit}`}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="outline">${item.totalCost?.toFixed(2)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!campaignUsage || campaignUsage.length === 0) &&
        (!testEmailUsage || testEmailUsage.length === 0) && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Consumption Data</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your campaign and test email usage data will appear here once you start sending emails.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
