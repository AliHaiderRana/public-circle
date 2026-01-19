import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { getSegmentContacts } from '@/actions/segments';
import { Eye } from 'lucide-react';

interface SegmentContactsDialogProps {
  segmentId: string | null;
  onClose: () => void;
  defaultPageSize?: number;
}

export function SegmentContactsDialog({
  segmentId,
  onClose,
  defaultPageSize = 10,
}: SegmentContactsDialogProps) {
  const [open, setOpen] = useState(Boolean(segmentId));
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setOpen(Boolean(segmentId));
    if (segmentId) {
      fetchContacts(segmentId, 1, pageSize);
    }
  }, [segmentId]);

  const fetchContacts = async (id: string, pageNumber = 1, size = defaultPageSize) => {
    // Cancel previous request if exists
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Create new AbortController for this request
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const response = await getSegmentContacts(id, pageNumber, size);
      if (response?.status === 200) {
        setContacts(response.data?.data?.contacts || []);
        setTotal(response.data?.data?.totalRecords || 0);
        setTotalPages(response.data?.data?.totalPages || 0);
        setPage(pageNumber);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching segment contacts:', error);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handlePageChange = (newPage: number) => {
    if (segmentId) {
      fetchContacts(segmentId, newPage, pageSize);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Segment Contacts</DialogTitle>
          <DialogDescription>
            View all contacts that match this segment's criteria
          </DialogDescription>
        </DialogHeader>

        {loading && contacts.length === 0 ? (
          <LoadingState />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts found"
            description="This segment doesn't match any contacts yet"
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact, index) => (
                    <TableRow key={contact._id || index}>
                      <TableCell className="font-medium">{contact.email || 'N/A'}</TableCell>
                      <TableCell>{contact.name || contact.firstName || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            contact.isSubscribed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {contact.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of{' '}
                  {total} contacts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
