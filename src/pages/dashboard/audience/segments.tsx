import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { Plus, RefreshCw, Edit, Trash2, Copy, Users, Eye } from 'lucide-react';
import {
  getPaginatedSegments,
  deleteSegment,
  duplicateSegment,
  getSegmentFilterCount,
} from '@/actions/segments';
import { paths } from '@/routes/paths';
import type { Segment } from '@/types/segment';
import { format } from 'date-fns';
import { SegmentContactsDialog } from '@/components/segments/SegmentContactsDialog';

export default function SegmentsPage() {
  const navigate = useNavigate();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [segmentToDuplicate, setSegmentToDuplicate] = useState<Segment | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [loadingSegmentId, setLoadingSegmentId] = useState<string | null>(null);
  const [segmentCountResult, setSegmentCountResult] = useState<any>(null);
  const [segmentCountDialogOpen, setSegmentCountDialogOpen] = useState(false);
  const [openSegmentContactsFor, setOpenSegmentContactsFor] = useState<string | null>(null);

  useEffect(() => {
    fetchSegments();
  }, [page, rowsPerPage]);

  const fetchSegments = async () => {
    try {
      setIsLoading(true);
      const res = await getPaginatedSegments(
        `?pageNumber=${page + 1}&pageSize=${rowsPerPage}`
      );

      if (res?.status === 200) {
        setSegments(res?.data?.data?.segments || []);
        setTotalCount(res?.data?.data?.totalRecords || 0);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
      toast.error('Failed to fetch segments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSegments();
    } catch (error) {
      console.error('Error refreshing segments:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleDelete = async () => {
    if (!segmentToDelete) return;

    try {
      const res = await deleteSegment(segmentToDelete._id);
      if (res?.status === 200) {
        toast.success('Segment deleted successfully');
        fetchSegments();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete segment');
    }
    setOpenDeleteDialog(false);
    setSegmentToDelete(null);
  };

  const handleDuplicate = async () => {
    if (!segmentToDuplicate) return;

    setIsDuplicating(true);
    try {
      const res = await duplicateSegment(segmentToDuplicate._id);
      if (res?.status === 200) {
        toast.success('Segment duplicated successfully');
        fetchSegments();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to duplicate segment');
    } finally {
      setIsDuplicating(false);
      setOpenDuplicateDialog(false);
      setSegmentToDuplicate(null);
    }
  };

  const handleCheckSegmentCount = async (segmentId: string) => {
    setLoadingSegmentId(segmentId);
    try {
      const response = await getSegmentFilterCount(segmentId);
      if (response?.status === 200) {
        setSegmentCountResult(response.data?.data);
        setSegmentCountDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching segment count:', error);
    } finally {
      setLoadingSegmentId(null);
    }
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  if (isLoading && segments.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">
            Organize your audience into segments based on shared characteristics, such as
            interests and attributes. This enables personalized communication and higher
            engagement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => navigate(paths.dashboard.audience?.newSegment || '/dashboard/audience/segments/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          title="No Segments found"
          description="Get started by creating your first segment"
          action={{
            label: 'Create Segment',
            onClick: () => navigate(paths.dashboard.audience?.newSegment || '/dashboard/audience/segments/new'),
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Segments</CardTitle>
            <CardDescription>
              Manage your audience segments. Total: {totalCount} segment{totalCount !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Fields Count</TableHead>
                    <TableHead className="text-center">Created At</TableHead>
                    <TableHead className="text-center">Audience Count</TableHead>
                    <TableHead className="text-center">Segment Contacts</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment._id}>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {segment.filters?.length || 0} filter{(segment.filters?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {format(new Date(segment.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckSegmentCount(segment._id)}
                          disabled={loadingSegmentId === segment._id}
                        >
                          {loadingSegmentId === segment._id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Check Count'
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenSegmentContactsFor(segment._id)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Segment Contacts
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSegmentToDuplicate(segment);
                              setOpenDuplicateDialog(true);
                            }}
                            disabled={isDuplicating}
                            title="Duplicate Segment"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(
                                `${paths.dashboard.audience?.newSegment || '/dashboard/audience/segments/new'}/${segment._id}`
                              )
                            }
                            title="Edit Segment"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSegmentToDelete(segment);
                              setOpenDeleteDialog(true);
                            }}
                            title="Delete Segment"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalCount > rowsPerPage && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {page * rowsPerPage + 1} to{' '}
                  {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount} segments
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(page + 1)}
                    disabled={(page + 1) * rowsPerPage >= totalCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this segment?
              {segmentToDelete && (
                <span className="font-semibold"> {segmentToDelete.name}</span>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={openDuplicateDialog} onOpenChange={setOpenDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Segment</DialogTitle>
            <DialogDescription>
              Are you sure you want to duplicate this segment?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDuplicateDialog(false)}
              disabled={isDuplicating}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={isDuplicating}>
              {isDuplicating ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Count Dialog */}
      <Dialog open={segmentCountDialogOpen} onOpenChange={setSegmentCountDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audience Count</DialogTitle>
            <DialogDescription>
              Breakdown of contacts matching the segment filters
            </DialogDescription>
          </DialogHeader>
          {segmentCountResult && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead className="text-center">Total Receiving Email</TableHead>
                      <TableHead className="text-center">Invalid Emails</TableHead>
                      <TableHead className="text-center">Unsubscribed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentCountResult
                      ?.filter((seg: any) => seg?.filterKey !== 'segmentCount')
                      .map((seg: any, index: number, filteredArray: any[]) => {
                        const isLastRow = index === filteredArray.length - 1;
                        return (
                          <>
                            <TableRow key={seg?.filterKey}>
                              <TableCell>{seg?.filterName}</TableCell>
                              <TableCell className="text-center">{seg?.filterCount}</TableCell>
                              <TableCell className="text-center">{seg?.invalidEmailCount}</TableCell>
                              <TableCell className="text-center">
                                {seg?.unSubscribedUserCount}
                              </TableCell>
                            </TableRow>
                            {!isLastRow && (
                              <TableRow>
                                <TableCell colSpan={4} className="py-1">
                                  <Badge variant="outline" className="ml-2">
                                    AND
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                  </TableBody>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <span className="font-bold">Total</span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="font-bold">
                          {segmentCountResult?.find((seg: any) => seg.filterKey === 'segmentCount')
                            ?.filterCount ?? segmentCountResult?.totalNumberOfContacts}
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="font-bold">
                          {segmentCountResult?.find((seg: any) => seg.filterKey === 'segmentCount')
                            ?.totalInvalidEmailCount ?? segmentCountResult?.totalInvalidEmailCount}
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="font-bold">
                          {segmentCountResult?.find((seg: any) => seg.filterKey === 'segmentCount')
                            ?.totalUnSubscribedCount ??
                            segmentCountResult?.totalUnSubscribedCount}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: The total count is not the sum of all contacts because a single contact can
                be a part of multiple fields.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSegmentCountDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Contacts Dialog */}
      {openSegmentContactsFor && (
        <SegmentContactsDialog
          segmentId={openSegmentContactsFor}
          onClose={() => setOpenSegmentContactsFor(null)}
        />
      )}
    </div>
  );
}
