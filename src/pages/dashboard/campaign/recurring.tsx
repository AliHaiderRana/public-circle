import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCampaigns, updateCampaign } from '@/actions/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { paths } from '@/routes/paths';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  Clock,
  Repeat,
  Loader2,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

type SortField = 'campaignName' | 'recurringPeriod' | 'lastProcessed' | 'nextRun' | 'processedCount' | 'status';
type SortOrder = 'ASC' | 'DSC';

interface RecurringCampaign {
  _id: string;
  campaignCompanyId: string;
  campaignName: string;
  emailSubject: string;
  recurringPeriod: string;
  lastProcessed?: string;
  processedCount: number;
  status: string;
  runSchedule?: string;
  companyGroupingId?: {
    groupName: string;
  };
  description?: string;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'default';
    case 'PAUSED':
      return 'outline';
    case 'ARCHIVED':
      return 'secondary';
    default:
      return 'outline';
  }
};

const calculateNextRun = (campaign: RecurringCampaign): string | null => {
  if (!campaign.recurringPeriod) return null;

  const parts = campaign.recurringPeriod.split(' ');
  const amount = parseInt(parts[0], 10);
  const unit = parts[1];

  if (!amount || !unit) return null;

  // Convert unit to dayjs duration unit
  const unitMap: Record<string, string> = {
    minute: 'minute',
    minutes: 'minute',
    hour: 'hour',
    hours: 'hour',
    day: 'day',
    days: 'day',
    month: 'month',
    months: 'month',
    year: 'year',
    years: 'year',
  };

  const dayjsUnit = unitMap[unit.toLowerCase()];
  if (!dayjsUnit) return null;

  // Calculate next run based on last processed or scheduled time
  const baseTime = campaign.lastProcessed
    ? dayjs(campaign.lastProcessed)
    : campaign.runSchedule
    ? dayjs(campaign.runSchedule)
    : dayjs();

  const nextRun = baseTime.add(amount, dayjsUnit as any);
  return nextRun.toISOString();
};

const formatRecurringPeriod = (period: string): string => {
  if (!period) return '-';
  const parts = period.split(' ');
  const amount = parts[0];
  const unit = parts[1]?.toLowerCase() || '';
  
  const unitLabels: Record<string, string> = {
    minute: 'minute',
    minutes: 'minutes',
    hour: 'hour',
    hours: 'hours',
    day: 'day',
    days: 'days',
    month: 'month',
    months: 'months',
    year: 'year',
    years: 'years',
  };

  const label = unitLabels[unit] || unit;
  return `${amount} ${label}`;
};

export default function RecurringCampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<RecurringCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('lastProcessed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DSC');
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<RecurringCampaign | null>(null);

  // Filter campaigns to only show recurring ones
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await getAllCampaigns({
        page,
        pageSize,
        sortBy: sortField,
        sortOrder: sortOrder.toLowerCase(),
        search: searchTerm || undefined,
        archiveFilter: 'active', // Only show active campaigns
      });

      if (response?.data?.data) {
        // Filter to only recurring campaigns
        const recurringCampaigns = response.data.data.allCampaigns?.filter(
          (campaign: any) => campaign.isRecurring === true
        ) || [];

        setCampaigns(recurringCampaigns);
        setTotalCount(recurringCampaigns.length);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch recurring campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, pageSize, sortField, sortOrder, searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DSC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('DSC');
    }
  };

  const handlePlayPause = async (campaign: RecurringCampaign, newStatus: 'ACTIVE' | 'PAUSED') => {
    if (newStatus === 'PAUSED') {
      setSelectedCampaign(campaign);
      setPauseDialogOpen(true);
      return;
    }

    await updateCampaignStatus(campaign, newStatus);
  };

  const updateCampaignStatus = async (campaign: RecurringCampaign, status: 'ACTIVE' | 'PAUSED') => {
    setUpdatingCampaignId(campaign._id);
    try {
      const response = await updateCampaign(campaign._id, { status });
      if (response?.data?.message) {
        toast.success(response.data.message);
        fetchCampaigns();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update campaign status');
    } finally {
      setUpdatingCampaignId(null);
      setPauseDialogOpen(false);
      setSelectedCampaign(null);
    }
  };

  const handleRefresh = () => {
    fetchCampaigns();
  };

  const campaignsWithNextRun = useMemo(() => {
    return campaigns.map((campaign) => ({
      ...campaign,
      nextRun: calculateNextRun(campaign),
    }));
  }, [campaigns]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recurring Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your recurring email campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={() => navigate(paths.dashboard.campaign.new)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">Active recurring campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'PAUSED').length}
            </div>
            <p className="text-xs text-muted-foreground">Temporarily stopped</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.processedCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total runs completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Search and filter recurring campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
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
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-auto sm:w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('campaignName')}
                    >
                      ID
                      <SortIcon field="campaignName" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('campaignName')}
                    >
                      Campaign Name
                      <SortIcon field="campaignName" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('recurringPeriod')}
                    >
                      Repeat Every
                      <SortIcon field="recurringPeriod" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('lastProcessed')}
                    >
                      Last Run
                      <SortIcon field="lastProcessed" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('nextRun')}
                    >
                      Next Run
                      <SortIcon field="nextRun" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('processedCount')}
                    >
                      Executions
                      <SortIcon field="processedCount" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <SortIcon field="status" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : campaignsWithNextRun.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No recurring campaigns found
                    </TableCell>
                  </TableRow>
                ) : (
                  campaignsWithNextRun.map((campaign) => (
                    <TableRow key={campaign._id}>
                      <TableCell className="font-mono text-sm">
                        {campaign.campaignCompanyId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{campaign.campaignName}</span>
                          {campaign.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{campaign.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.emailSubject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4 text-muted-foreground" />
                          <span>{formatRecurringPeriod(campaign.recurringPeriod)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.lastProcessed ? (
                          <div>
                            <div className="text-sm">
                              {dayjs(campaign.lastProcessed).format('MMM D, YYYY')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dayjs(campaign.lastProcessed).format('h:mm A')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.nextRun ? (
                          <div>
                            <div className="text-sm font-medium">
                              {dayjs(campaign.nextRun).format('MMM D, YYYY')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dayjs(campaign.nextRun).format('h:mm A')}
                            </div>
                            <div className="text-xs text-primary mt-1">
                              {dayjs(campaign.nextRun).fromNow()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{campaign.processedCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    navigate(paths.dashboard.campaign.details(campaign._id))
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    navigate(paths.dashboard.campaign.edit(campaign._id))
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Campaign</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {campaign.status === 'ACTIVE' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePlayPause(campaign, 'PAUSED')}
                                    disabled={updatingCampaignId === campaign._id}
                                  >
                                    {updatingCampaignId === campaign._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Pause className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Pause Campaign</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePlayPause(campaign, 'ACTIVE')}
                                    disabled={updatingCampaignId === campaign._id}
                                  >
                                    {updatingCampaignId === campaign._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Resume Campaign</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{' '}
                {Math.min(page * pageSize, totalCount)} of {totalCount} campaigns
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pause Confirmation Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Recurring Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to pause "{selectedCampaign?.campaignName}"? The campaign will
              stop running on its schedule until you resume it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCampaign && updateCampaignStatus(selectedCampaign, 'PAUSED')}
            >
              Pause Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
