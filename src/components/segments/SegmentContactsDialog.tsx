import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { getSegmentContacts } from '@/actions/segments';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { paths } from '@/routes/paths';

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
  const navigate = useNavigate();
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
      const response = await getSegmentContacts([id], pageNumber, size);
      if (response?.status === 200) {
        setContacts(response.data?.data?.validContacts || []);
        setTotal(response.data?.data?.totalContacts || 0);
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
    if (segmentId && newPage >= 1 && newPage <= totalPages) {
      fetchContacts(segmentId, newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    setPageSize(size);
    if (segmentId) {
      fetchContacts(segmentId, 1, size);
    }
  };

  const handleViewContact = (contact: any) => {
    // Close the dialog and navigate to contacts page with selected contact
    handleClose();
    navigate(paths.dashboard.contacts.list, {
      state: { selectedContact: contact },
    });
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Segment Contacts</DialogTitle>
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
            <div className="rounded-md border max-h-[50vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact, index) => (
                    <TableRow key={contact._id || index}>
                      <TableCell>{contact.email || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewContact(contact)}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground ml-4">
                  {startIndex}-{endIndex} of {total}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
