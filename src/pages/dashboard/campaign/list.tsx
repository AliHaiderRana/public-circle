import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCampaigns } from '@/actions/campaign';
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
import { paths } from '@/routes/paths';
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Edit, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CampaignStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'ARCHIVED' | 'INACTIVE' | 'all';

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

export default function CampaignListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus>('all');
  const pageSize = 10;

  // Debounce search term (500ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset page on new search
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Reset page to 1 when filters change
  const handleStatusFilterChange = (value: CampaignStatus) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Don't reset page here - let debounce handle it
  };

  // Use server-side filtering and pagination with debounced search term
  const { allCampaigns, totalCount, isLoading, error } = getAllCampaigns(
    page,
    pageSize,
    statusFilter,
    debouncedSearchTerm
  );

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your email campaigns
          </p>
        </div>
        <Button onClick={() => navigate(paths.dashboard.campaign.new)}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name, subject, or description..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => handleStatusFilterChange(value as CampaignStatus)}>
              <SelectTrigger className="w-[180px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Loading...' : `${totalCount || 0} Campaign${totalCount !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">
                Failed to load campaigns. Please try again.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : allCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {debouncedSearchTerm || statusFilter !== 'all'
                  ? 'No campaigns match your filters'
                  : 'No campaigns found. Create your first campaign!'}
              </p>
              {!debouncedSearchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate(paths.dashboard.campaign.new)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCampaigns.map((campaign: any) => (
                      <TableRow
                        key={campaign._id || campaign.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(paths.dashboard.campaign.details(campaign._id || campaign.id))}
                      >
                        <TableCell className="font-medium">
                          {campaign.campaignName || campaign.subject || 'Untitled Campaign'}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {campaign.emailSubject || campaign.subject || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(campaign.status)}>
                            {campaign.status || 'DRAFT'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                        <TableCell>
                          {campaign.processedCount || 0} emails
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(paths.dashboard.campaign.details(campaign._id || campaign.id))}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(paths.dashboard.campaign.edit(campaign._id || campaign.id))}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} • {totalCount || 0} total campaigns
                  </div>
                  <div className="flex gap-2">
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
