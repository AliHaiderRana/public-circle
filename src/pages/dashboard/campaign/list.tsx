import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCampaigns, updateCampaign, archiveCampaign, getCampaignSegmentCounts, deleteCampaign } from '@/actions/campaign';
import { getAllCampaignGroups } from '@/actions/groups';
import { SubscriptionStatusAlert } from '@/components/subscription/subscription-status-alert';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Play,
  Pause,
  Archive,
  ArchiveRestore,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Users,
  Info,
  Loader2,
  Mail,
  PlayCircle,
  FileText,
  Archive as ArchiveIcon,
  X,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LoadingState, TableLoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState, EmptySearchState } from '@/components/ui/empty-state';
import { AccountRestrictionDialog } from '@/components/campaign/AccountRestrictionDialog';
import { LiveStatusIndicator } from '@/components/campaign/live-status-indicator';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { mutate } from 'swr';

type CampaignStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'ARCHIVED' | 'INACTIVE' | 'all';
type SortField = 'id' | 'campaignName' | 'group' | 'emailSubject' | 'sourceEmailAddress' | 'runMode' | 'ongoing' | 'recurringPeriod' | 'lastProcessed' | 'status' | 'updatedAt';
type SortOrder = 'ASC' | 'DSC';

const statusOptions: { value: CampaignStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'PAUSED':
      return 'outline';
    case 'ARCHIVED':
      return 'outline';
    case 'INACTIVE':
      return 'destructive';
    default:
      return 'outline';
  }
};

const toCamelCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[_\s]+(.)?/g, (match, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^./, (match) => match.toUpperCase());
};

const formatDate = (date: string | Date | null | undefined) => {
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

const formatTime = (date: string | Date | null | undefined) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export default function CampaignListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus>('all');
  const [sortField, setSortField] = useState<SortField>('lastProcessed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DSC');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived'>('active');
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [archivingCampaignId, setArchivingCampaignId] = useState<string | null>(null);
  const [segmentCountLoadingId, setSegmentCountLoadingId] = useState<string | null>(null);
  const [segmentCountDialogOpen, setSegmentCountDialogOpen] = useState(false);
  const [segmentCountResult, setSegmentCountResult] = useState<any>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [campaignToArchive, setCampaignToArchive] = useState<any>(null);
  const [archiveAction, setArchiveAction] = useState<'archive' | 'unarchive'>('archive');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { allGroups } = getAllCampaignGroups();

  // Debounce search term (500ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset page on new search
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const selectedGroupIds = selectedGroups.join(',');

  // Use server-side filtering and pagination with debounced search term
  const { allCampaigns, totalCount, isLoading, error } = getAllCampaigns(
    page,
    pageSize,
    statusFilter !== 'all' ? statusFilter : undefined,
    debouncedSearchTerm,
    sortField,
    sortOrder,
    selectedGroupIds || undefined,
    archiveFilter
  );

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  // Calculate campaign stats
  const campaignStats = useMemo(() => {
    if (!allCampaigns || allCampaigns.length === 0) {
      return {
        total: 0,
        active: 0,
        paused: 0,
        draft: 0,
        archived: 0,
      };
    }
    return {
      total: allCampaigns.length,
      active: allCampaigns.filter((c: any) => c.status === 'ACTIVE').length,
      paused: allCampaigns.filter((c: any) => c.status === 'PAUSED').length,
      draft: allCampaigns.filter((c: any) => c.status === 'DRAFT').length,
      archived: allCampaigns.filter((c: any) => c.status === 'ARCHIVED').length,
    };
  }, [allCampaigns]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'ASC' ? 'DSC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('DSC');
    }
    setPage(1);
  };

  const handleStatusFilterChange = (value: CampaignStatus) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleArchiveFilterChange = (value: 'active' | 'archived') => {
    setArchiveFilter(value);
    setPage(1);
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
    setPage(1);
  };

  // Auto-refresh campaigns every 30 seconds
  const campaignsUrl = useMemo(() => {
    const params = new URLSearchParams({
      pageNumber: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (sortField) params.append('sortBy', sortField);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (selectedGroupIds) params.append('companyGroupingIds', selectedGroupIds);
    if (archiveFilter === 'archived') params.append('status', 'ARCHIVED');
    return `/campaigns?${params.toString()}`;
  }, [page, pageSize, statusFilter, debouncedSearchTerm, sortField, sortOrder, selectedGroupIds, archiveFilter]);

  useAutoRefresh({
    enabled: true,
    interval: 30000, // 30 seconds
    keys: [campaignsUrl],
    onRefresh: async () => {
      await mutate(campaignsUrl);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force revalidation by mutating the SWR cache
      await mutate(campaignsUrl);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const playPauseCampaign = async (campaign: any, status: 'ACTIVE' | 'PAUSED') => {
    setUpdatingCampaignId(campaign._id);
    try {
      const res = await updateCampaign(campaign._id, { status });
      if (res?.status === 200) {
        toast.success(res?.data?.message || `Campaign ${status === 'ACTIVE' ? 'started' : 'paused'} successfully`);
        handleRefresh();
      } else {
        if (res?.kind === 'BANDWIDTH_LIMIT_REACHED' || res?.kind === 'EMAIL_LIMIT_REACHED') {
          toast.error(res?.message || 'Bandwidth or email limit reached');
        } else {
          toast.error(res?.message || 'Failed to update campaign');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update campaign');
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  const handleOpenArchiveDialog = (campaign: any, action: 'archive' | 'unarchive') => {
    setCampaignToArchive(campaign);
    setArchiveAction(action);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (campaignToArchive && archiveAction) {
      setArchivingCampaignId(campaignToArchive._id);
      try {
        const isArchived = archiveAction === 'archive';
        const res = await archiveCampaign(campaignToArchive._id, isArchived);
        if (res?.status === 200) {
          toast.success(res?.data?.message || `Campaign ${archiveAction === 'archive' ? 'archived' : 'unarchived'} successfully`);
          handleRefresh();
        } else {
          toast.error(res?.message || `Failed to ${archiveAction} campaign`);
        }
      } catch (error: any) {
        toast.error(error?.message || `Failed to ${archiveAction} campaign`);
      } finally {
        setArchivingCampaignId(null);
      }
    }
    setArchiveDialogOpen(false);
    setCampaignToArchive(null);
  };

  const handleCheckSegmentCount = async (campaign: any) => {
    setSegmentCountLoadingId(campaign._id);
    try {
      const response = await getCampaignSegmentCounts(campaign._id);
      if (response?.status === 200) {
        setSegmentCountResult(response.data?.data);
        setSegmentCountDialogOpen(true);
      } else {
        toast.error(response?.data?.message || 'Failed to fetch segment count');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch segment count');
    } finally {
      setSegmentCountLoadingId(null);
    }
  };

  const handleOpenDeleteDialog = (campaign: any) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteCampaign(campaignToDelete._id);
      if (res?.status === 200) {
        toast.success('Campaign deleted successfully');
        handleRefresh();
      } else {
        toast.error(res?.data?.message || 'Failed to delete campaign');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status Alert */}
      <SubscriptionStatusAlert />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage and track your email campaigns
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh campaigns</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={() => navigate(paths.dashboard.campaign.new)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {!isLoading && allCampaigns && allCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Campaigns
              </CardTitle>
              <div className="bg-gray-50 p-2 rounded-lg">
                <Mail className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently showing
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
              <div className="bg-green-50 p-2 rounded-lg">
                <PlayCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Running campaigns
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paused
              </CardTitle>
              <div className="bg-yellow-50 p-2 rounded-lg">
                <Pause className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.paused}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Temporarily paused
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Drafts
              </CardTitle>
              <div className="bg-gray-50 p-2 rounded-lg">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.draft}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Not yet started
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Archived
              </CardTitle>
              <div className="bg-slate-50 p-2 rounded-lg">
                <ArchiveIcon className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.archived}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Archived campaigns
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            {(searchTerm || statusFilter !== 'all' || selectedGroups.length > 0 || archiveFilter !== 'active') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSelectedGroups([]);
                  setArchiveFilter('active');
                  setPage(1);
                }}
                className="h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name, subject, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Quick Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Quick filters:</span>
              {statusOptions.filter(opt => opt.value !== 'all').map((option) => (
                <Badge
                  key={option.value}
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleStatusFilterChange(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Select
                  value={archiveFilter}
                  onValueChange={(value) => handleArchiveFilterChange(value as 'active' | 'archived')}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => handleStatusFilterChange(value as CampaignStatus)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[140px]">
                      <Users className="mr-2 h-4 w-4" />
                      Groups
                      {selectedGroups.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedGroups.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Filter by Groups</h4>
                        <p className="text-xs text-muted-foreground">
                          Select one or more groups to filter campaigns
                        </p>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {allGroups && allGroups.length > 0 ? (
                          allGroups.map((group: any) => (
                            <div key={group._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={group._id}
                                checked={selectedGroups.includes(group._id)}
                                onCheckedChange={() => handleGroupToggle(group._id)}
                              />
                              <Label
                                htmlFor={group._id}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {group.groupName || group.name}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No groups available</p>
                        )}
                      </div>
                      {selectedGroups.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setSelectedGroups([])}
                        >
                          Clear selection
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">
                Failed to load campaigns. Please try again.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded flex-shrink-0" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded flex-1" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded flex-1" />
                  <div className="h-4 w-40 bg-muted animate-pulse rounded flex-1" />
                  <div className="h-4 w-28 bg-muted animate-pulse rounded flex-1" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : allCampaigns.length === 0 ? (
            debouncedSearchTerm || statusFilter !== 'all' || selectedGroups.length > 0 || archiveFilter !== 'active' ? (
              <EmptySearchState
                searchTerm={debouncedSearchTerm || 'filters'}
                onClear={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSelectedGroups([]);
                  setArchiveFilter('active');
                  setPage(1);
                }}
              />
            ) : (
              <EmptyState
                title="No campaigns yet"
                description="Get started by creating your first email campaign"
                actionLabel="Create Campaign"
                onAction={() => navigate(paths.dashboard.campaign.new)}
                variant="card"
              />
            )
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-2">
                          ID
                          {getSortIcon('id')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('campaignName')}
                      >
                        <div className="flex items-center gap-2">
                          Campaign Name
                          {getSortIcon('campaignName')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('group')}
                      >
                        <div className="flex items-center gap-2">
                          Group
                          {getSortIcon('group')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('emailSubject')}
                      >
                        <div className="flex items-center gap-2">
                          Subject
                          {getSortIcon('emailSubject')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('sourceEmailAddress')}
                      >
                        <div className="flex items-center gap-2">
                          From Email
                          {getSortIcon('sourceEmailAddress')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('runMode')}
                      >
                        <div className="flex items-center gap-2">
                          Run Mode
                          {getSortIcon('runMode')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('ongoing')}
                      >
                        <div className="flex items-center gap-2">
                          Ongoing
                          {getSortIcon('ongoing')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('recurringPeriod')}
                      >
                        <div className="flex items-center gap-2">
                          Repeat Every
                          {getSortIcon('recurringPeriod')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('lastProcessed')}
                      >
                        <div className="flex items-center gap-2">
                          Last Run
                          {getSortIcon('lastProcessed')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center gap-2">
                          Updated At
                          {getSortIcon('updatedAt')}
                        </div>
                      </TableHead>
                      <TableHead className="w-auto sm:w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {error ? (
                      <TableRow>
                        <TableCell colSpan={12} className="p-0">
                          <ErrorState
                            title="Failed to load campaigns"
                            message={error?.message || 'An error occurred while fetching campaigns'}
                            onRetry={() => window.location.reload()}
                            variant="compact"
                            className="m-4"
                          />
                        </TableCell>
                      </TableRow>
                    ) : !allCampaigns || allCampaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="p-0">
                          {searchTerm || statusFilter !== 'all' || selectedGroups.length > 0 || archiveFilter !== 'active' ? (
                            <EmptySearchState
                              searchTerm={searchTerm || 'filters'}
                              onClear={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setSelectedGroups([]);
                                setArchiveFilter('active');
                                setPage(1);
                              }}
                            />
                          ) : (
                            <EmptyState
                              title="No campaigns yet"
                              description="Get started by creating your first email campaign"
                              actionLabel="Create Campaign"
                              onAction={() => navigate(paths.dashboard.campaign.new)}
                              variant="minimal"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      allCampaigns.map((campaign: any) => (
                        <TableRow key={campaign._id || campaign.id}>
                        <TableCell className="font-mono text-sm">
                          {campaign.campaignCompanyId || campaign.id || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {campaign.campaignName || 'Untitled Campaign'}
                            </span>
                            {campaign.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{campaign.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign?.companyGroupingId?.groupName || '—'}
                        </TableCell>
                        <TableCell className="max-w-[120px] sm:max-w-[200px] truncate">
                          {campaign.emailSubject || '—'}
                        </TableCell>
                        <TableCell className="max-w-[120px] sm:max-w-[200px] truncate">
                          {campaign.sourceEmailAddress || '—'}
                        </TableCell>
                        <TableCell>
                          {campaign.runMode === 'INSTANT'
                            ? 'Broadcast'
                            : campaign.runMode?.toLowerCase() || '—'}
                        </TableCell>
                        <TableCell>
                          {campaign.isOnGoing ? 'True' : 'False'}
                        </TableCell>
                        <TableCell>
                          {campaign.recurringPeriod || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(campaign.lastProcessed)}</div>
                            <div className="text-muted-foreground text-xs">
                              {formatTime(campaign.lastProcessed)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <LiveStatusIndicator
                            status={campaign.status || 'DRAFT'}
                            isProcessing={updatingCampaignId === campaign._id}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(campaign.updatedAt)}</div>
                            <div className="text-muted-foreground text-xs">
                              {formatTime(campaign.updatedAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {campaign.status !== 'ARCHIVED' && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          if (campaign.status === 'PAUSED' || campaign.status === 'DRAFT') {
                                            playPauseCampaign(campaign, 'ACTIVE');
                                          } else if (campaign.status === 'ACTIVE') {
                                            playPauseCampaign(campaign, 'PAUSED');
                                          }
                                        }}
                                        disabled={updatingCampaignId === campaign._id}
                                      >
                                        {updatingCampaignId === campaign._id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : campaign.status === 'ACTIVE' ? (
                                          <Pause className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4 text-green-600" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {campaign.status === 'ACTIVE' ? 'Pause' : 'Start'} Campaign
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => navigate(paths.dashboard.campaign.edit(campaign._id))}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Campaign</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          navigate(paths.dashboard.logs.detail, {
                                            state: {
                                              campaignId: campaign._id,
                                              campaignName: campaign.emailSubject,
                                            },
                                          })
                                        }
                                      >
                                        <BarChart3 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Campaign Logs</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleCheckSegmentCount(campaign)}
                                        disabled={!campaign?.segments?.length || segmentCountLoadingId === campaign._id}
                                      >
                                        {segmentCountLoadingId === campaign._id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Users className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Check Segment Count</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      handleOpenArchiveDialog(
                                        campaign,
                                        campaign.status === 'ARCHIVED' ? 'unarchive' : 'archive'
                                      )
                                    }
                                    disabled={archivingCampaignId === campaign._id}
                                  >
                                    {archivingCampaignId === campaign._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : campaign.status === 'ARCHIVED' ? (
                                      <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {campaign.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'} Campaign
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => navigate(paths.dashboard.campaign.details(campaign._id))}
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
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleOpenDeleteDialog(campaign)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Campaign</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {allCampaigns.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount || 0)} of {totalCount || 0} campaigns
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setPage(1);
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full sm:w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 25, 50, 100, 200, 300, 400, 500].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={page === 1 || isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1 mx-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages || isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      Page {page} of {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {archiveAction === 'archive' ? 'Archive Campaign' : 'Unarchive Campaign'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {archiveAction} this campaign?
              {campaignToArchive && (
                <strong className="block mt-2">{campaignToArchive.campaignName}</strong>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchiveConfirm} disabled={archivingCampaignId !== null}>
              {archivingCampaignId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                archiveAction === 'archive' ? 'Archive' : 'Unarchive'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-full bg-destructive/10 p-2">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              Delete Campaign
            </DialogTitle>
            <DialogDescription className="pt-4">
              Are you sure you want to delete this campaign? This action cannot be undone.
              {campaignToDelete && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="font-medium text-sm">{campaignToDelete.campaignName || campaignToDelete.emailSubject}</p>
                  {campaignToDelete.campaignCompanyId && (
                    <p className="text-xs text-muted-foreground mt-1">ID: {campaignToDelete.campaignCompanyId}</p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Count Dialog */}
      <Dialog open={segmentCountDialogOpen} onOpenChange={setSegmentCountDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audience Count</DialogTitle>
            <DialogDescription>
              Total contacts who will receive this campaign
            </DialogDescription>
          </DialogHeader>
          {segmentCountResult ? (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment Name</TableHead>
                      <TableHead className="text-center">Total Recipients</TableHead>
                      <TableHead className="text-center">Invalid Emails</TableHead>
                      <TableHead className="text-center">Unsubscribed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentCountResult.segments?.map((seg: any, index: number) => {
                      const isLastRow = index === segmentCountResult.segments.length - 1;
                      return (
                        <React.Fragment key={seg.segmentId}>
                          <TableRow>
                            <TableCell>{seg.segmentName}</TableCell>
                            <TableCell className="text-center">{seg.contactCount}</TableCell>
                            <TableCell className="text-center">{seg.invalidEmailCount}</TableCell>
                            <TableCell className="text-center">{seg.unSubscribedCount}</TableCell>
                          </TableRow>
                          {!isLastRow && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-2">
                                <Badge variant="outline">OR</Badge>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Total</TableHead>
                      <TableHead className="text-center font-bold">
                        {segmentCountResult.totalNumberOfContacts}
                      </TableHead>
                      <TableHead className="text-center font-bold">
                        {segmentCountResult.totalInvalidEmailCount}
                      </TableHead>
                      <TableHead className="text-center font-bold">
                        {segmentCountResult.totalUnSubscribedCount}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                <p className="font-medium mb-2">Note:</p>
                <p>
                  The total count is not the sum of all contacts because a single contact can be
                  part of multiple segments. These are unique emails.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
          <DialogFooter>
            <Button onClick={() => setSegmentCountDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
