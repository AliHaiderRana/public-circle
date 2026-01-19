import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  getDuplicateContacts,
  resolveDuplicates,
  type DuplicateContact,
} from '@/actions/contacts';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ContactMergerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: () => void;
}

export function ContactMerger({ open, onOpenChange, onResolved }: ContactMergerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (open) {
      fetchDuplicates();
    }
  }, [open, page]);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const response = await getDuplicateContacts(page);
      if (response) {
        setDuplicates(response.duplicateContacts || []);
        setTotalRecords(response.totalRecords || 0);
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (duplicate: DuplicateContact, keepNew: boolean) => {
    try {
      await resolveDuplicates({
        contactsToBeSaved: keepNew ? [duplicate.new] : [duplicate.old],
        isSaveNewContact: keepNew,
      });
      fetchDuplicates();
      onResolved();
    } catch (error) {
      console.error('Error resolving duplicate:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Duplicate Contacts</DialogTitle>
          <DialogDescription>
            Review and resolve duplicate contacts in your database
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState />
        ) : duplicates.length === 0 ? (
          <EmptyState
            title="No duplicates found"
            description="All contacts are unique"
          />
        ) : (
          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Existing Contact</h4>
                    <div className="text-xs bg-muted p-2 rounded space-y-1">
                      {Object.entries(duplicate.old).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => handleResolve(duplicate, false)}
                    >
                      Keep Existing
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">New Contact</h4>
                    <div className="text-xs bg-muted p-2 rounded space-y-1">
                      {Object.entries(duplicate.new).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => handleResolve(duplicate, true)}
                    >
                      Keep New
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalRecords > 10 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(totalRecords / 10)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(totalRecords / 10)}
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
