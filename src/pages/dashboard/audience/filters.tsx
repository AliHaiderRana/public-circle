import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, RefreshCw, Edit, Trash2, Tag, Type, List, Calendar } from 'lucide-react';
import { paths } from '@/routes/paths';
import { getPaginatedFilters, deleteFilter } from '@/actions/filters';
import { toast } from 'sonner';

export default function FiltersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, [page, rowsPerPage]);

  const fetchFilters = async () => {
    setIsRefreshing(true);
    try {
      const res = await getPaginatedFilters(`?pageNumber=${page + 1}&pageSize=${rowsPerPage}`);
      if (res?.status === 200) {
        setFilters(res?.data?.data?.filters || []);
        setTotalCount(res?.data?.data?.totalRecords || 0);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!filterToDelete) return;
    try {
      const res = await deleteFilter(filterToDelete._id);
      if (res?.status === 200) {
        toast.success('Filter deleted successfully');
        fetchFilters();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete filter');
    } finally {
      setIsDeleteDialogOpen(false);
      setFilterToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Fields</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Create data fields to allow segmentation of audience
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchFilters}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => navigate(paths.dashboard.audience.newfilter)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Field
          </Button>
        </div>
      </div>

      {totalCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No fields found</p>
            <Button onClick={() => navigate(paths.dashboard.audience.newfilter)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Field Type</TableHead>
                    <TableHead>Values</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filters.map((filter) => (
                    <TableRow key={filter._id}>
                      <TableCell className="font-medium">{filter.filterKey}</TableCell>
                      <TableCell>{filter.filterType}</TableCell>
                      <TableCell>
                        {filter.filterValueCount === 0
                          ? '---'
                          : `(${filter.filterValueCount} ${filter.filterValueCount > 1 ? 'options' : 'option'})`}
                      </TableCell>
                      <TableCell>
                        {new Date(filter.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`${paths.dashboard.audience.newfilter}/${filter._id}`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFilterToDelete(filter);
                              setIsDeleteDialogOpen(true);
                            }}
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

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-3">
              {filters.map((filter) => (
                <Card key={filter._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Field Name Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <h3 className="font-semibold text-base truncate">
                            {filter.filterKey}
                          </h3>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate(`${paths.dashboard.audience.newfilter}/${filter._id}`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setFilterToDelete(filter);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Field Details */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Type className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{filter.filterType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <List className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Values:</span>
                          <span>
                            {filter.filterValueCount === 0
                              ? '---'
                              : `${filter.filterValueCount} ${filter.filterValueCount > 1 ? 'options' : 'option'}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(filter.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{filterToDelete?.filterKey}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
