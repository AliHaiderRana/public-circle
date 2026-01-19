import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Check } from 'lucide-react';
import {
  getDuplicateContacts,
  resolveDuplicates,
  type DuplicateContact,
  type Contact,
} from '@/actions/contacts';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

interface ContactMergerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: () => void;
}

export function ContactMerger({ open, onOpenChange, onResolved }: ContactMergerProps) {
  const [duplicateContacts, setDuplicateContacts] = useState<DuplicateContact[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedContact, setSelectedContact] = useState<DuplicateContact | null>(null);
  const [editedContact, setEditedContact] = useState<{ old: Contact; new: Contact } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const hasMore = duplicateContacts.length < totalRecords;

  useEffect(() => {
    if (open) {
      fetchDuplicates(1);
    }
  }, [open]);

  const fetchDuplicates = async (page: number) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await getDuplicateContacts(page);
      if (result) {
        if (page === 1) {
          setDuplicateContacts(result.duplicateContacts);
          setSelectedContact(result.duplicateContacts[0] || null);
          if (result.duplicateContacts[0]) {
            setEditedContact({
              old: { ...result.duplicateContacts[0].old },
              new: { ...result.duplicateContacts[0].new },
            });
          }
        } else {
          setDuplicateContacts((prev) => [...prev, ...result.duplicateContacts]);
        }
        setTotalRecords(result.totalRecords);
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      toast.error('Failed to fetch duplicate contacts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchDuplicates(nextPage);
  };

  const handleSelectContact = (contact: DuplicateContact) => {
    setSelectedContact(contact);
    setEditedContact({
      old: { ...contact.old },
      new: { ...contact.new },
    });
  };

  const handleFieldChange = (type: 'old' | 'new', key: string, value: string) => {
    if (!editedContact) return;

    setEditedContact({
      ...editedContact,
      [type]: {
        ...editedContact[type],
        [key]: value,
      },
    });
  };

  const handleAcceptContact = async (contactType: 'old' | 'new' | 'allnew' | 'allexist') => {
    setIsResolving(true);
    try {
      let params: any;

      if (contactType === 'allnew') {
        params = { isSaveNewContact: true };
      } else if (contactType === 'allexist') {
        params = { isSaveNewContact: false };
      } else if (contactType === 'old' && editedContact) {
        params = { contactsToBeSaved: [editedContact.old] };
      } else if (contactType === 'new' && editedContact) {
        params = { contactsToBeSaved: [editedContact.new] };
      } else {
        return;
      }

      await resolveDuplicates(params);
      onResolved();

      if (contactType === 'allnew' || contactType === 'allexist') {
        onOpenChange(false);
      } else {
        // Remove resolved contact from list
        if (selectedContact) {
          setDuplicateContacts((prev) =>
            prev.filter(
              (c) =>
                c.old._id !== selectedContact.old._id &&
                c.new._id !== selectedContact.new._id
            )
          );
          // Select next contact
          const remaining = duplicateContacts.filter(
            (c) =>
              c.old._id !== selectedContact.old._id && c.new._id !== selectedContact.new._id
          );
          if (remaining.length > 0) {
            handleSelectContact(remaining[0]);
          } else {
            setSelectedContact(null);
            setEditedContact(null);
          }
        }
      }
    } catch (error) {
      console.error('Error resolving duplicate:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const getPrimaryKey = () => {
    // This should come from the primary key state, but for now we'll use _id
    return '_id';
  };

  const primaryKey = getPrimaryKey();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Resolve {totalRecords} Duplicate {totalRecords === 1 ? 'Contact' : 'Contacts'}
          </DialogTitle>
          <DialogDescription>
            Compare and merge conflicting contact details by selecting either the existing or new
            contact information.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : duplicateContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No duplicate contacts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sidebar with duplicate list */}
            <div className="lg:col-span-3 space-y-2">
              <Label className="text-sm font-medium">Duplicate Contacts</Label>
              <ScrollArea className="h-[500px] border rounded-md p-2">
                {duplicateContacts.map((contact, index) => {
                  const isSelected =
                    selectedContact?.old._id === contact.old._id &&
                    selectedContact?.new._id === contact.new._id;
                  const displayName =
                    contact.old.firstName && contact.old.lastName
                      ? `${contact.old.firstName} ${contact.old.lastName}`
                      : Object.values(contact.old)[0] || 'Contact';

                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleSelectContact(contact)}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                      </CardContent>
                    </Card>
                  );
                })}
                {hasMore && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="w-full"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </ScrollArea>

              {/* Bulk Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAcceptContact('allexist')}
                  disabled={isResolving}
                >
                  Accept All {totalRecords} Existing
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAcceptContact('allnew')}
                  disabled={isResolving}
                >
                  Accept All {totalRecords} New
                </Button>
              </div>
            </div>

            {/* Comparison View */}
            {selectedContact && editedContact && (
              <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['old', 'new'] as const).map((type) => {
                  const isOld = type === 'old';
                  const contact = editedContact[type];
                  const title = isOld ? 'Existing Contact' : 'New Contact';

                  return (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle className="text-lg">{title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {Object.entries(contact)
                              .filter(
                                ([key]) =>
                                  !['_id', 'public_circles_company', 'public_circles_is_unsubscribed'].includes(
                                    key
                                  )
                              )
                              .map(([key, value]) => {
                                const isPrimaryKey = key === primaryKey;
                                const displayValue = typeof value === 'object' && value !== null
                                  ? JSON.stringify(value)
                                  : String(value || '');

                                return (
                                  <div key={key} className="space-y-2">
                                    <Label className="text-sm font-medium">{key}:</Label>
                                    {isPrimaryKey ? (
                                      <div className="p-2 bg-muted rounded-md">
                                        <span className="text-sm">{displayValue}</span>
                                        <Badge variant="secondary" className="ml-2">
                                          Primary Key
                                        </Badge>
                                      </div>
                                    ) : (
                                      <Input
                                        value={displayValue}
                                        onChange={(e) =>
                                          handleFieldChange(type, key, e.target.value)
                                        }
                                        disabled={isPrimaryKey}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </ScrollArea>
                        <div className="pt-4">
                          <Button
                            className="w-full"
                            onClick={() => handleAcceptContact(type)}
                            disabled={isResolving}
                          >
                            {isResolving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Resolving...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Accept {title}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
