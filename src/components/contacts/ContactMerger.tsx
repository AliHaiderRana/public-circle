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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getDuplicateContacts,
  resolveDuplicates,
  type DuplicateContact,
} from '@/actions/contacts';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactMergerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: () => void;
}

// Fields to hide from display
const HIDDEN_FIELDS = ['_id', 'public_circles_company', 'public_circles_is_unsubscribed'];

export function ContactMerger({ open, onOpenChange, onResolved }: ContactMergerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setPage(1);
      setDuplicates([]);
      setSelectedIndex(0);
      fetchDuplicates(1, true);
    }
  }, [open]);

  const fetchDuplicates = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const response = await getDuplicateContacts(pageNum);
      if (response) {
        if (reset) {
          setDuplicates(response.duplicateContacts || []);
        } else {
          setDuplicates(prev => [...prev, ...(response.duplicateContacts || [])]);
        }
        setTotalRecords(response.totalRecords || 0);
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchDuplicates(nextPage, false);
  };

  const handleResolve = async (contactType: 'old' | 'new' | 'allold' | 'allnew') => {
    setIsResolving(true);
    try {
      const selectedDuplicate = duplicates[selectedIndex];

      if (contactType === 'allold') {
        await resolveDuplicates({ isSaveNewContact: false });
        onOpenChange(false);
      } else if (contactType === 'allnew') {
        await resolveDuplicates({ isSaveNewContact: true });
        onOpenChange(false);
      } else {
        const contact = contactType === 'old' ? selectedDuplicate.old : selectedDuplicate.new;
        await resolveDuplicates({ contactsToBeSaved: [contact] });
      }

      // Refresh the list
      setPage(1);
      await fetchDuplicates(1, true);
      setSelectedIndex(0);
      onResolved();
    } catch (error) {
      console.error('Error resolving duplicate:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const selectedDuplicate = duplicates[selectedIndex];
  const hasMore = duplicates.length < totalRecords;

  // Get display name for a contact
  const getContactDisplayName = (contact: any) => {
    if (contact?.firstName && contact?.lastName) {
      return `${contact.firstName} ${contact.lastName}`;
    }
    if (contact?.email) {
      return contact.email;
    }
    const firstValue = Object.values(contact).find(v => v && typeof v === 'string');
    return firstValue || 'Unknown Contact';
  };

  // Filter out hidden fields
  const getDisplayFields = (contact: any) => {
    return Object.entries(contact).filter(([key]) => !HIDDEN_FIELDS.includes(key));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-center text-xl">
            Resolve {totalRecords} Duplicate {totalRecords === 1 ? 'Contact' : 'Contacts'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Compare and merge conflicting contact details by selecting either the existing or new contact information.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingState />
          </div>
        ) : duplicates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="No duplicates found"
              description="All contacts are unique"
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Duplicate Contacts List */}
            <div className="w-64 border-r flex flex-col bg-muted/30">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Duplicate Contacts</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {duplicates.map((duplicate, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full text-left p-3 rounded-md text-sm transition-all',
                        selectedIndex === index
                          ? 'bg-background border-2 border-primary shadow-sm'
                          : 'bg-muted/50 hover:bg-muted border border-transparent'
                      )}
                    >
                      <span className="font-medium truncate block">
                        {getContactDisplayName(duplicate.old)}
                      </span>
                    </button>
                  ))}
                  {hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  )}
                </div>
              </ScrollArea>

              {/* Accept All Buttons */}
              <div className="p-3 border-t space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleResolve('allold')}
                  disabled={isResolving}
                >
                  Accept All {totalRecords} Existing
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => handleResolve('allnew')}
                  disabled={isResolving}
                >
                  Accept All {totalRecords} New
                </Button>
              </div>
            </div>

            {/* Main Content - Comparison View */}
            {selectedDuplicate && (
              <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Existing Contact */}
                <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="font-semibold">Existing Contact</h3>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {getDisplayFields(selectedDuplicate.old).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start gap-4 text-sm">
                          <span className="font-medium text-muted-foreground min-w-[120px]">{key}:</span>
                          <span className="text-right break-all">{String(value || '-')}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => handleResolve('old')}
                      disabled={isResolving}
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        'Accept Existing Contact'
                      )}
                    </Button>
                  </div>
                </div>

                {/* New Contact */}
                <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="font-semibold">New Contact</h3>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {getDisplayFields(selectedDuplicate.new).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start gap-4 text-sm">
                          <span className="font-medium text-muted-foreground min-w-[120px]">{key}:</span>
                          <span className="text-right break-all">{String(value || '-')}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => handleResolve('new')}
                      disabled={isResolving}
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        'Accept New Contact'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isResolving && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
