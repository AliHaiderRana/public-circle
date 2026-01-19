import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  RefreshCw,
  Trash2,
  Eye,
  Edit,
  Upload,
  Download,
  Settings,
  Key,
  Mail,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getPaginatedContacts,
  deleteContact,
  deleteContacts,
  getInvalidEmailCount,
  getUnSubscribedEmailCount,
  getApplePrivateContactsCount,
  finalizeContacts,
  type ContactFilter,
} from '@/actions/contacts';
import { paths } from '@/routes/paths';
import { ContactSearch } from '@/components/contacts/ContactSearch';
import { ContactTableRow } from '@/components/contacts/ContactTableRow';
import { TableCustomization } from '@/components/contacts/TableCustomization';
import { PrimaryKeyManagement } from '@/components/contacts/PrimaryKeyManagement';
import { EmailKeyManagement } from '@/components/contacts/EmailKeyManagement';
import { ContactMerger } from '@/components/contacts/ContactMerger';
import { FilterSection } from '@/components/contacts/FilterSection';
import { ExportContactsDialog } from '@/components/contacts/ExportContactsDialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAuthContext } from '@/auth/hooks/use-auth-context';

export default function ContactsListPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<ContactFilter[]>([]);
  const [invalidEmailsChecked, setInvalidEmailsChecked] = useState(false);
  const [unsubscribedChecked, setUnsubscribedChecked] = useState(false);
  const [applePrivateChecked, setApplePrivateChecked] = useState(false);
  const [complaintUsersChecked, setComplaintUsersChecked] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [openPrimaryKeyDialog, setOpenPrimaryKeyDialog] = useState(false);
  const [openEmailKeyDialog, setOpenEmailKeyDialog] = useState(false);
  const [openMergerDialog, setOpenMergerDialog] = useState(false);
  const [openTableCustomization, setOpenTableCustomization] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [openFinalizeDialog, setOpenFinalizeDialog] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const { user, checkUserSession } = useAuthContext();
  const isContactFinalized = user?.company?.isContactFinalize;

  const { InvalidEmailCount, DuplicatedCount } = getInvalidEmailCount();
  const { UnSubscribedEmailCount } = getUnSubscribedEmailCount();
  const { ApplePrivateContactsCount } = getApplePrivateContactsCount();

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [page, rowsPerPage, searchFilters, invalidEmailsChecked, unsubscribedChecked, applePrivateChecked, complaintUsersChecked]);

  const fetchContacts = async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await getPaginatedContacts(
        page,
        rowsPerPage,
        searchFilters,
        {
          isUnSubscribed: unsubscribedChecked,
          isInvalidEmail: invalidEmailsChecked,
          isPrivateRelayEmail: applePrivateChecked,
          ...(complaintUsersChecked && { unSubscribedReason: 'UN_SUBSCRIBED_BY_COMPLAINT' }),
        }
      );

      setContacts(response.data || []);
      setTotalCount(response.total || 0);

      // Set visible keys from first contact if available
      if (response.data?.length > 0) {
        const keys = Object.keys(response.data[0]).filter((k) => k !== '__v');
        setVisibleKeys(keys.slice(0, 8));
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to fetch contacts');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchContacts();
    } catch (error) {
      console.error('Error refreshing contacts:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleFinalizeContacts = async () => {
    setIsFinalizing(true);
    try {
      await finalizeContacts();
      setOpenFinalizeDialog(false);
      await checkUserSession?.();
      fetchContacts();
    } catch (error) {
      console.error('Error finalizing contacts:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      await deleteContact(contactToDelete);
      setOpenDeleteDialog(false);
      setContactToDelete(null);
      setSelectedContacts(selectedContacts.filter((id) => id !== contactToDelete));
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    try {
      await deleteContacts(selectedContacts);
      setOpenBulkDeleteDialog(false);
      setSelectedContacts([]);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contacts:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((contact) => contact._id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, id]);
    } else {
      setSelectedContacts(selectedContacts.filter((contactId) => contactId !== id));
    }
  };

  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage your contacts, configure keys, and resolve duplicates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setOpenExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setOpenTableCustomization(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Customize Table
          </Button>
          <Button variant="outline" onClick={() => setOpenPrimaryKeyDialog(true)}>
            <Key className="mr-2 h-4 w-4" />
            Primary Key
          </Button>
          <Button variant="outline" onClick={() => setOpenEmailKeyDialog(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Email Key
          </Button>
          <Button variant="outline" onClick={() => setOpenMergerDialog(true)}>
            <Users className="mr-2 h-4 w-4" />
            Duplicates
          </Button>
          <Button variant="outline" asChild>
            <a href={paths.dashboard.configurations?.contacts || '#'}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </a>
          </Button>
          {!isContactFinalized && (
            <Button onClick={() => setOpenFinalizeDialog(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Invalid Emails
              {InvalidEmailCount > 0 && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {InvalidEmailCount.toLocaleString()}
            </div>
            {DuplicatedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {DuplicatedCount} duplicates
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{UnSubscribedEmailCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Apple Private Relay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ApplePrivateContactsCount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <FilterSection onCriteriaChange={(criteria) => {
        // Handle selection criteria change
        console.log('Selection criteria:', criteria);
      }} />

      {/* Search & Filters */}
      <ContactSearch
        searchFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        invalidEmailsChecked={invalidEmailsChecked}
        setInvalidEmailsChecked={setInvalidEmailsChecked}
        unsubscribedChecked={unsubscribedChecked}
        setUnsubscribedChecked={setUnsubscribedChecked}
        applePrivateChecked={applePrivateChecked}
        setApplePrivateChecked={setApplePrivateChecked}
        complaintUsersChecked={complaintUsersChecked}
        setComplaintUsersChecked={setComplaintUsersChecked}
        onFiltersChange={() => {
          setPage(0);
        }}
      />

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedContacts.length} contact(s) selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpenBulkDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            Manage your contact list. Total: {totalCount.toLocaleString()} contact
            {totalCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && contacts.length === 0 ? (
            <LoadingState variant="table" rows={rowsPerPage} />
          ) : contacts.length === 0 ? (
            <EmptyState
              title="No contacts found"
              description="Get started by importing contacts from a CSV file"
              action={{
                label: 'Import CSV',
                onClick: () => window.location.href = paths.dashboard.configurations?.contacts || '#',
              }}
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0 z-20">
                    <TableHead className="w-12 sticky left-0 bg-muted/50 z-30 border-r">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className="cursor-pointer"
                      />
                    </TableHead>
                    {visibleKeys.map((key) => (
                      <TableHead key={key} className="capitalize whitespace-nowrap">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </TableHead>
                    ))}
                    <TableHead className="text-right sticky right-0 bg-muted/50 z-30 border-l">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <ContactTableRow
                      key={contact._id}
                      contact={contact}
                      visibleKeys={visibleKeys}
                      isSelected={selectedContacts.includes(contact._id)}
                      onSelect={(checked) => handleSelectContact(contact._id, checked)}
                      onDelete={() => {
                        setContactToDelete(contact._id);
                        setOpenDeleteDialog(true);
                      }}
                      onEdit={(updatedContact) => {
                        // Handle edit - will be implemented
                        console.log('Edit contact:', updatedContact);
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing <span className="font-medium text-foreground">{page * rowsPerPage + 1}</span> to{' '}
                  <span className="font-medium text-foreground">{Math.min((page + 1) * rowsPerPage, totalCount)}</span> of{' '}
                  <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> contacts
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="rows-per-page" className="text-sm whitespace-nowrap">
                    Rows per page:
                  </Label>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger id="rows-per-page" className="w-[90px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0 || isLoading}
                  className="min-w-[100px]"
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-md whitespace-nowrap">
                  Page <span className="font-medium text-foreground">{page + 1}</span> of{' '}
                  <span className="font-medium text-foreground">{Math.ceil(totalCount / rowsPerPage)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * rowsPerPage >= totalCount || isLoading}
                  className="min-w-[100px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
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

      {/* Bulk Delete Dialog */}
      <Dialog open={openBulkDeleteDialog} onOpenChange={setOpenBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedContacts.length} contact(s)? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedContacts.length} Contact(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Primary Key Management */}
      {openPrimaryKeyDialog && (
        <PrimaryKeyManagement
          open={openPrimaryKeyDialog}
          onOpenChange={setOpenPrimaryKeyDialog}
          onUpdate={fetchContacts}
        />
      )}

      {/* Email Key Management */}
      {openEmailKeyDialog && (
        <EmailKeyManagement
          open={openEmailKeyDialog}
          onOpenChange={setOpenEmailKeyDialog}
          invalidEmailCount={InvalidEmailCount}
        />
      )}

      {/* Contact Merger */}
      {openMergerDialog && (
        <ContactMerger
          open={openMergerDialog}
          onOpenChange={setOpenMergerDialog}
          onResolved={fetchContacts}
        />
      )}

      {/* Table Customization */}
      {openTableCustomization && (
        <TableCustomization
          open={openTableCustomization}
          onOpenChange={setOpenTableCustomization}
          visibleKeys={visibleKeys}
          setVisibleKeys={setVisibleKeys}
          contacts={contacts}
        />
      )}

      {/* Export Dialog */}
      <ExportContactsDialog
        open={openExportDialog}
        onOpenChange={setOpenExportDialog}
        filters={searchFilters}
        totalCount={totalCount}
        options={{
          isUnSubscribed: unsubscribedChecked,
          isInvalidEmail: invalidEmailsChecked,
          isPrivateRelayEmail: applePrivateChecked,
          ...(complaintUsersChecked && { unSubscribedReason: 'UN_SUBSCRIBED_BY_COMPLAINT' }),
        }}
      />

      {/* Finalize Contacts Dialog */}
      <Dialog open={openFinalizeDialog} onOpenChange={setOpenFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Contact List</DialogTitle>
            <DialogDescription>
              This list will be used when the campaign runs. You can still make updates before the
              campaign starts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenFinalizeDialog(false)}
              disabled={isFinalizing}
            >
              Cancel
            </Button>
            <LoadingButton onClick={handleFinalizeContacts} loading={isFinalizing}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finalize
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
