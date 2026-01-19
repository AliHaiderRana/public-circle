import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { RefreshCw, Upload, Trash2, Users, Download, CheckCircle2 } from 'lucide-react';
import { getDuplicateContacts, finalizeContacts } from '@/actions/contacts';
import {
  getPaginatedContacts,
  deleteContact,
  deleteContacts,
  type Contact,
  type ContactFilter,
} from '@/actions/contacts';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ProcessingModal, ProcessingModalNoProgress } from '@/components/ui/processing-modal';
import { useProcessingModal } from '@/hooks/use-processing-modal';
import { getFilterKeys } from '@/actions/filters';
import { ContactTableRow } from '../contact-table-row';
import type { Contact as ContactType } from '@/actions/contacts';
import { ContactSearch } from '../contact-search';
import { ContactImportDialog } from '../contact-import-dialog';
import { ContactDeleteDialog } from '../contact-delete-dialog';
import { ContactExportDialog } from '../contact-export-dialog';
import { PrimaryKeyManagement } from '../primary-key-management';
import { EmailKeyManagement } from '../email-key-management';
import { ContactMerger } from '../contact-merger';
import { ContactsStatistics } from '../contacts-statistics';
import { TableCustomization } from '../table-customization';
import { FilterSection } from '../filter-section';
import { formatKeyName } from '../utils';

// ----------------------------------------------------------------------

export function ContactsListView() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingFilters = (location.state as any)?.filters as ContactFilter[] | undefined;

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShimmer, setIsLoadingShimmer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<ContactFilter[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isMergerOpen, setIsMergerOpen] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  // Processing modal hook
  const {
    isProcessing,
    progress: processingProgress,
    title: processingTitle,
    message: processingMessage,
    isIndeterminate: isProcessingIndeterminate,
    status: processingStatus,
    showProcessingModal,
    updateProcessingProgress,
    hideProcessingModal,
    setStatus: setProcessingStatus,
  } = useProcessingModal();

  // Auth context
  const { user, checkUserSession } = useAuthContext();
  const isContactFinalized = user?.company?.isContactFinalize;

  // Quick filter states
  const [invalidEmailsChecked, setInvalidEmailsChecked] = useState(false);
  const [unsubscribedChecked, setUnsubscribedChecked] = useState(false);
  const [applePrivateContactsChecked, setApplePrivateContactsChecked] = useState(false);
  const [complaintUsersChecked, setComplaintUsersChecked] = useState(false);

  // Get filter keys
  const { filterKeysData } = getFilterKeys();

  // Fetch duplicate count
  useEffect(() => {
    const fetchDuplicateCount = async () => {
      try {
        const result = await getDuplicateContacts(1);
        if (result) {
          setDuplicateCount(result.totalRecords);
        }
      } catch (error) {
        console.error('Error fetching duplicate count:', error);
      }
    };
    fetchDuplicateCount();
  }, []);

  // Initialize visible keys from user company data or filter keys
  useEffect(() => {
    if (filterKeysData?.data && visibleKeys.length === 0) {
      // First, try to load from user company data
      const savedOrder = user?.company?.contactsDisplayOrder;
      
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        // Filter to only include keys that still exist
        const validKeys = savedOrder.filter((key: string) =>
          filterKeysData.data.includes(key)
        );
        if (validKeys.length > 0) {
          setVisibleKeys(validKeys);
          // Also save to localStorage as backup
          localStorage.setItem('contacts-visible-keys', JSON.stringify(validKeys));
          return;
        }
      }
      
      // Fallback to localStorage
      const localStorageKeys = localStorage.getItem('contacts-visible-keys');
      if (localStorageKeys) {
        try {
          const parsedKeys = JSON.parse(localStorageKeys);
          const validKeys = parsedKeys.filter((key: string) =>
            filterKeysData.data.includes(key)
          );
          if (validKeys.length > 0) {
            setVisibleKeys(validKeys);
            return;
          }
        } catch (error) {
          console.error('Error loading saved visible keys from localStorage:', error);
        }
      }
      
      // Default: Show first 5 keys
      const defaultKeys = filterKeysData.data.slice(0, 5);
      setVisibleKeys(defaultKeys);
      localStorage.setItem('contacts-visible-keys', JSON.stringify(defaultKeys));
    }
  }, [filterKeysData, user?.company?.contactsDisplayOrder, visibleKeys.length]);

  // Save visible keys to backend and localStorage when they change
  const handleVisibleKeysChange = useCallback(
    async (newVisibleKeys: string[]) => {
      setVisibleKeys(newVisibleKeys);
      // Save to localStorage immediately
      localStorage.setItem('contacts-visible-keys', JSON.stringify(newVisibleKeys));
      
      // Save to backend
      try {
        const { updateUser } = await import('@/actions/signup');
        await updateUser({ contactsDisplayOrder: newVisibleKeys });
        await checkUserSession?.();
      } catch (error) {
        console.error('Error saving column order to backend:', error);
        // Don't show error toast as this is a background operation
      }
    },
    [checkUserSession]
  );

  // Fetch contacts
  const fetchContacts = useCallback(
    async (showLoader = false, showShimmer = false) => {
      if (showLoader) setIsLoading(true);
      if (showShimmer) setIsLoadingShimmer(true);

      try {
        const result = await getPaginatedContacts(
          page,
          rowsPerPage,
          searchFilters,
          {
            isUnSubscribed: unsubscribedChecked,
            isInvalidEmail: invalidEmailsChecked,
            isPrivateRelayEmail: applePrivateContactsChecked,
            ...(complaintUsersChecked && { unSubscribedReason: 'UN_SUBSCRIBED_BY_COMPLAINT' }),
          }
        );
        if (result) {
          setContacts(result.data || []);
          setTotalContacts(result.total || 0);
        } else {
          setContacts([]);
          setTotalContacts(0);
        }
      } catch (error: any) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
        setTotalContacts(0);
        if (error?.message) {
          toast.error(error.message);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingShimmer(false);
        setIsRefreshing(false);
      }
    },
    [page, rowsPerPage, searchFilters, invalidEmailsChecked, unsubscribedChecked, applePrivateContactsChecked, complaintUsersChecked]
  );

  // Initialize with incoming filters
  useEffect(() => {
    if (incomingFilters && Array.isArray(incomingFilters) && incomingFilters.length > 0) {
      setSearchFilters(incomingFilters);
    }
  }, [incomingFilters]);

  // Fetch contacts on mount and when dependencies change
  useEffect(() => {
    fetchContacts(false, true);
  }, [fetchContacts]);

  // Fetch when filters change (reset to first page)
  useEffect(() => {
    if (searchFilters.length > 0 || invalidEmailsChecked || unsubscribedChecked || applePrivateContactsChecked || complaintUsersChecked) {
      setPage(0); // Reset to first page
    }
  }, [searchFilters, invalidEmailsChecked, unsubscribedChecked, applePrivateContactsChecked, complaintUsersChecked]);

  // Handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((contact) => contact._id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleDeleteContact = (contactId: string) => {
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedContacts.length === 0) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (contactToDelete) {
        await deleteContact(contactToDelete);
        setContactToDelete(null);
      } else if (selectedContacts.length > 0) {
        await deleteContacts(selectedContacts);
        setSelectedContacts([]);
      }
      setDeleteDialogOpen(false);
      await fetchContacts(false, true);
    } catch (error) {
      console.error('Error deleting contact(s):', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchContacts(false, true);
  };

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    fetchContacts(false, true);
  };

  const handleFinalizeContacts = async () => {
    setIsFinalizing(true);
    try {
      await finalizeContacts();
      setIsFinalizeDialogOpen(false);
      await checkUserSession?.();
      await fetchContacts(false, true);
    } catch (error) {
      console.error('Error finalizing contacts:', error);
    } finally {
      setIsFinalizing(false);
    }
  };


  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact list</p>
        </div>
        <div className="flex items-center gap-2">
          {duplicateCount > 0 && (
            <Button variant="outline" onClick={() => setIsMergerOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Resolve Duplicates ({duplicateCount})
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {!isContactFinalized && contacts.length > 0 && (
            <Button onClick={() => setIsFinalizeDialogOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalize Contacts
            </Button>
          )}
          {isContactFinalized && (
            <Badge variant="outline" className="px-3 py-1.5">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Contacts Finalized
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics */}
      <ContactsStatistics />

      {/* Key Management */}
      <div className="grid gap-4 md:grid-cols-2">
        <PrimaryKeyManagement />
        <EmailKeyManagement />
      </div>

      {/* Table Customization */}
      {filterKeysData?.data && (
        <TableCustomization
          availableKeys={filterKeysData.data}
          visibleKeys={visibleKeys}
          onVisibleKeysChange={handleVisibleKeysChange}
        />
      )}

      {/* Search & Filters */}
      <ContactSearch
        searchFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        filterKeysData={filterKeysData}
        invalidEmailsChecked={invalidEmailsChecked}
        setInvalidEmailsChecked={setInvalidEmailsChecked}
        unsubscribedChecked={unsubscribedChecked}
        setUnsubscribedChecked={setUnsubscribedChecked}
        applePrivateContactsChecked={applePrivateContactsChecked}
        setApplePrivateContactsChecked={setApplePrivateContactsChecked}
        complaintUsersChecked={complaintUsersChecked}
        setComplaintUsersChecked={setComplaintUsersChecked}
        onApplyFilters={fetchContacts}
      />

      {/* Advanced Filter Section */}
      <FilterSection
        searchFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        filterKeysData={filterKeysData}
        onFiltersChange={() => fetchContacts(false, true)}
      />

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedContacts.length > 0
                ? `${selectedContacts.length} selected`
                : `Contacts (${totalContacts})`}
            </CardTitle>
            {selectedContacts.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 && !isLoading && !isLoadingShimmer ? (
            <EmptyState
              title="No contacts found"
              description="You can upload a CSV file to import contacts"
              actionLabel="Import Contacts"
              onAction={() => setIsImportDialogOpen(true)}
              variant="card"
            />
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead className="w-12 sticky left-0 z-20 bg-background border-r">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        {visibleKeys.map((key) => (
                          <TableHead key={key} className="min-w-[100px] sm:min-w-[150px]">
                            {formatKeyName(key)}
                          </TableHead>
                        ))}
                        <TableHead className="w-24 sticky right-0 z-20 bg-background border-l">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoadingShimmer ? (
                      // Shimmer loading
                      Array.from({ length: rowsPerPage }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="sticky left-0 z-10 bg-background border-r">
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          {visibleKeys.map((key) => (
                            <TableCell key={key}>
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                          ))}
                          <TableCell className="sticky right-0 z-10 bg-background border-l">
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      contacts.map((contact) => (
                        <ContactTableRow
                          key={contact._id}
                          contact={contact}
                          selected={selectedContacts.includes(contact._id)}
                          onSelect={() => handleSelectContact(contact._id)}
                          onDelete={() => handleDeleteContact(contact._id)}
                          visibleKeys={visibleKeys}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalContacts > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{page * rowsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min((page + 1) * rowsPerPage, totalContacts)}
                    </span>{' '}
                    of <span className="font-medium">{totalContacts}</span> contacts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0 || isLoading}
                    >
                      Previous
                    </Button>
                    <div className="text-sm px-3">
                      Page <span className="font-medium">{page + 1}</span> of{' '}
                      <span className="font-medium">{Math.ceil(totalContacts / rowsPerPage)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= Math.ceil(totalContacts / rowsPerPage) - 1 || isLoading}
                    >
                      Next
                    </Button>
                    <div className="flex items-center gap-2 ml-2">
                      <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground">
                        Rows:
                      </Label>
                      <select
                        id="rows-per-page"
                        value={rowsPerPage}
                        onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ContactImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={handleImportSuccess}
      />

      <ContactDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        contactId={contactToDelete}
        selectedCount={contactToDelete ? 0 : selectedContacts.length}
      />

      <ContactMerger
        open={isMergerOpen}
        onOpenChange={setIsMergerOpen}
        onResolved={() => {
          fetchContacts(false, true);
        }}
      />

      <ContactExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        searchFilters={searchFilters}
        selectedContacts={selectedContacts}
        totalContacts={totalContacts}
        filterOptions={{
          invalidEmailsChecked,
          unsubscribedChecked,
          applePrivateContactsChecked,
          complaintUsersChecked,
        }}
      />

      {/* Finalize Dialog */}
      <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Contact List</DialogTitle>
            <DialogDescription>
              This list will be used when the campaign runs. You can still make updates before the
              campaign starts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalizeContacts} disabled={isFinalizing}>
              {isFinalizing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                'Finalize'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing Modal */}
      {isProcessing && (
        isProcessingIndeterminate ? (
          <ProcessingModalNoProgress
            title={processingTitle}
            message={processingMessage}
            onClose={hideProcessingModal}
            showCloseButton={true}
            status={processingStatus}
          />
        ) : (
          <ProcessingModal
            progress={processingProgress || 0}
            title={processingTitle}
            message={processingMessage}
            onClose={hideProcessingModal}
            showCloseButton={true}
            status={processingStatus}
          />
        )
      )}
    </div>
  );
}
