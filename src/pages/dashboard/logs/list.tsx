import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { getAllCampaignLogs } from "@/actions/logs";
import { mutate } from "swr";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CampaignLog {
  _id: string;
  emailSubject?: string;
  campaignName?: string;
  totalRuns?: number;
  createdAt?: string;
  lastProcessed?: string;
  usersCount?: number;
  status?: string;
  sentCount?: number;
  failedCount?: number;
}

export default function CampaignLogsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    debounceTimerRef.current = timer;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Build query params for pagination
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append("pageNumber", page.toString());
    params.append("pageSize", pageSize.toString());
    if (debouncedSearchTerm) {
      params.append("search", debouncedSearchTerm);
    }
    return params.toString();
  }, [page, pageSize, debouncedSearchTerm]);

  const { allLogs, totalRecords, isLoading } = getAllCampaignLogs(queryParams);

  // Ensure logs is always an array
  const rawLogs = Array.isArray(allLogs) ? allLogs : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate(`${endpoints.logs.logs}?${queryParams}`);
    } catch (error) {
      console.error("Error refreshing logs:", error);
      toast.error("Failed to refresh logs");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (
    date: string | Date | null | undefined,
    time?: string | Date | null | undefined,
  ) => {
    const dateStr = formatDate(date);
    if (!time) return dateStr;

    try {
      const timeStr = new Date(time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateStr} ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const handleViewRuns = (log: CampaignLog) => {
    if (!log._id) {
      toast.error("Campaign ID is required");
      return;
    }

    const campaignName = log.emailSubject || log.campaignName || "Campaign";
    navigate(paths.dashboard.logs.detail, {
      state: {
        campaignId: log._id,
        campaignName,
      },
    });
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = () => {
    setPage(1);
  };

  const totalPages = Math.ceil((totalRecords || 0) / pageSize);
  const displayLogs = rawLogs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Logs</h1>
          <p className="text-muted-foreground mt-1">
            View and manage campaign execution logs
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (isRefreshing || isLoading) && "animate-spin",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by campaign name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading
              ? "Loading..."
              : `${totalRecords || 0} Campaign Log${(totalRecords || 0) !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !rawLogs.length ? (
            <div className="space-y-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : !rawLogs.length ? (
            <EmptyState
              title="No Logs found"
              description="No campaign logs found. Campaign logs will appear here after campaigns are executed."
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead className="text-center">Total Runs</TableHead>
                      <TableHead className="text-center">Last Run At</TableHead>
                      <TableHead className="text-center">Users Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayLogs.map((log: CampaignLog) => {
                      const campaignName =
                        log.emailSubject || log.campaignName || "—";
                      const totalRuns = log.totalRuns || 0;
                      const isDisabled = totalRuns === 0;

                      return (
                        <TableRow key={log._id}>
                          <TableCell className="font-medium">
                            {campaignName}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              <span>{totalRuns}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDateTime(
                                  log.createdAt,
                                  log.lastProcessed,
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{log.usersCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewRuns(log)}
                                      disabled={isDisabled}
                                      className={cn(
                                        isDisabled &&
                                          "opacity-50 cursor-not-allowed",
                                      )}
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isDisabled
                                    ? "No runs available"
                                    : "View Campaign Runs"}
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
                    Page {page} of {totalPages} • {totalRecords || 0} total log
                    {(totalRecords || 0) !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={() => handleChangeRowsPerPage()}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50, 100, 200, 300, 400, 500].map(
                          (size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} per page
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangePage(Math.max(1, page - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleChangePage(Math.min(totalPages, page + 1))
                      }
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
