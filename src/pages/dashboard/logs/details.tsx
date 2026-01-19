import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { paths } from '@/routes/paths';
import { getCampaignById } from '@/actions/campaign';
import { getCampaignRuns as getRuns, getCampaignRunsStats as getStats } from '@/actions/logs';
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Calendar,
  Mail,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Eye,
  MousePointerClick,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dayjs, { Dayjs } from 'dayjs';
import { EmailAnalyticsChart } from '@/components/dashboard/email-analytics-chart';
import { EmptyState } from '@/components/ui/empty-state';

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const formatDateOnly = (date: string | Date | null | undefined) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

interface CampaignRunStats {
  totalCampaignRuns?: number;
  totalEmailsSent?: number;
  totalEmailsDelivered?: number;
  totalEmailsOpened?: number;
  totalEmailsClicked?: number;
  totalEmailsFailed?: number;
  totalEmailsDelayed?: number;
  totalResendEmails?: number;
  graphData?: Record<string, number>;
}

export default function CampaignLogDetailsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = (location.state as any)?.campaignId || searchParams.get('campaignId');
  const campaignName = (location.state as any)?.campaignName || searchParams.get('campaignName') || 'Campaign';

  const [campaign, setCampaign] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [stats, setStats] = useState<CampaignRunStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  useEffect(() => {
    if (campaignId) {
      fetchData();
    } else {
      toast.error('Campaign ID is required');
      navigate(paths.dashboard.logs.root);
    }
  }, [campaignId, page, pageSize]);

  useEffect(() => {
    if (campaignId) {
      fetchStats();
    }
  }, [campaignId, selectedPeriod, selectedDate]);

  const fetchData = async () => {
    if (!campaignId) return;

    setIsLoading(true);
    try {
      const [campaignRes, runsRes] = await Promise.all([
        getCampaignById(campaignId),
        getRuns(campaignId, page, pageSize),
      ]);

      if (campaignRes?.data?.data) {
        setCampaign(campaignRes.data.data);
      }

      if (runsRes?.data?.data) {
        setRuns(runsRes.data.data.campaignRuns || []);
        setTotalCount(runsRes.data.data.totalRecords || 0);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load campaign logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!campaignId) return;

    setIsStatsLoading(true);
    try {
      const params = {
        graphScope: {
          ...(selectedPeriod === 'yearly' && { yearly: 10 }),
          ...(selectedPeriod === 'monthly' && { monthly: { year: selectedDate.year() } }),
          ...(selectedPeriod === 'daily' && {
            daily: {
              month: selectedDate.format('MMM'),
              year: selectedDate.year(),
            },
          }),
        },
      };

      const statsRes = await getStats(campaignId, params);
      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchData(), fetchStats()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleViewMessages = (runId: string, isDataStoredOnWarehouse: boolean) => {
    navigate(paths.dashboard.logs.messages, {
      state: {
        runId,
        campaignName: campaign?.campaignName || campaignName,
        campaignId,
        isDataStoredOnWarehouse,
      },
    });
  };

  const formatChartData = (data: Record<string, number> | undefined) => {
    if (!data) return { categories: [], series: [] };

    const categories = Object.keys(data);
    const values = Object.values(data);

    return {
      categories,
      series: [
        {
          name: 'Emails Sent',
          data: values,
        },
      ],
    };
  };

  const handlePeriodChange = (newPeriod: 'daily' | 'monthly' | 'yearly') => {
    setSelectedPeriod(newPeriod);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading && !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(paths.dashboard.logs.root)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaign?.campaignName || campaignName} - Runs
            </h1>
            <p className="text-muted-foreground mt-1">View campaign execution history and statistics</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRefreshing ? 'Refreshing...' : 'Refresh'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Statistics Widgets */}
      {stats && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalCampaignRuns || totalCount || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Runs</div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{stats.totalEmailsSent || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Sent</div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{stats.totalEmailsDelivered || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Delivered</div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{stats.totalEmailsOpened || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Opened</div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-indigo-600">{stats.totalEmailsClicked || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Clicked</div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{stats.totalEmailsFailed || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Failed</div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">{stats.totalEmailsDelayed || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Delayed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Chart */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="analytics">
          <AccordionTrigger className="px-6">
            <CardTitle>Sent Emails Analytics</CardTitle>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent>
              <EmailAnalyticsChart
                title=""
                subheader={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Email Distribution`}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={handlePeriodChange}
                loading={isStatsLoading}
                chart={
                  isStatsLoading
                    ? { categories: [], series: [] }
                    : formatChartData(stats?.graphData)
                }
              />
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Campaign Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Runs</CardTitle>
          <CardDescription>History of campaign executions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <EmptyState
              title="No campaign runs found"
              description="Campaign runs will appear here once the campaign starts executing"
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run At</TableHead>
                      <TableHead>Total Emails</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => {
                      const isWarehouse = run.isDataStoredOnWarehouse;
                      return (
                        <TableRow key={run._id || run.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(run.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {run.emailsSentCount || run.emailCounts?.total || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isWarehouse ? 'secondary' : 'default'}>
                              {isWarehouse ? 'Archived' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewMessages(run._id || run.id, isWarehouse)}
                                      disabled={false}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isWarehouse
                                    ? 'View archived emails (loads from warehouse)'
                                    : 'View emails'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of{' '}
                    {totalCount} runs
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50, 100, 200, 300, 400, 500].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} per page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}