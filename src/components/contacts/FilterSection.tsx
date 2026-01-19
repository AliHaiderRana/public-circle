import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  X,
  CheckCircle2,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  getFilterKeys,
  getSelectionCriteriaEffect,
  finalizeContacts,
  getFiltersRevertRequests,
  revertContactsFinalize,
  cancelRevertContactsFinalize,
  type ContactFilter,
} from '@/actions/contacts';
import { getContactFilterValues } from '@/actions/contacts';
import { updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/ui/loading-button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface FilterSectionProps {
  onCriteriaChange?: () => void;
}

interface SavedCriteria {
  _id?: string;
  filterKey: string;
  filterValues: string[];
}

export function FilterSection({ onCriteriaChange }: FilterSectionProps) {
  const { user, checkUserSession } = useAuthContext();
  const { filterKeys } = getFilterKeys();
  const [filters, setFilters] = useState<ContactFilter[]>([]);
  const [matchType, setMatchType] = useState<'all' | 'any'>('all');
  const [savedCriteria, setSavedCriteria] = useState<SavedCriteria[]>([]);
  const [isLoadingEffect, setIsLoadingEffect] = useState(false);
  const [effectPreview, setEffectPreview] = useState<string | null>(null);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isDeletingCriteria, setIsDeletingCriteria] = useState(false);
  const [criteriaToDelete, setCriteriaToDelete] = useState<string | null>(null);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isCancelRevertDialogOpen, setIsCancelRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const availableFilterKeys = filterKeys || [];
  const { filtersRequest } = getFiltersRevertRequests();
  const isLocked = user?.company?.isContactFilterLocked;
  const hasPendingRequest = filtersRequest?.requestStatus === 'PENDING';

  // Load saved criteria from user data
  useEffect(() => {
    if (user?.company?.contactSelectionCriteria) {
      setSavedCriteria(user.company.contactSelectionCriteria);
    }
  }, [user]);

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      {
        id: uuidv4(),
        filterKey: null,
        filterValues: [],
        valuesData: [],
        filterValuesPage: 1,
        hasMore: true,
        searchTerm: '',
        isFilterLoading: false,
      },
    ]);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId));
    setEffectPreview(null);
  };

  const handleFilterKeyChange = async (filterId: string, filterKey: string) => {
    setFilters(
      filters.map((f) =>
        f.id === filterId
          ? {
              ...f,
              filterKey,
              filterValues: [],
              valuesData: [],
              filterValuesPage: 1,
              hasMore: true,
              searchTerm: '',
            }
          : f
      )
    );

    if (filterKey) {
      await fetchFilterValues(filterId, filterKey, 1, '');
    }
  };

  const fetchFilterValues = async (filterId: string, filterKey: string, page: number = 1, searchTerm: string = '') => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, isFilterLoading: true } : f))
    );

    try {
      const result = await getContactFilterValues(filterKey, searchTerm, page);
      // Extract string values from the result
      const stringValues = result.values.map((val: any) => {
        if (typeof val === 'string') return val;
        return val.value || val.label || String(val);
      });
      
      setFilters((prev) =>
        prev.map((f) =>
          f.id === filterId
            ? {
                ...f,
                valuesData: page === 1 ? stringValues : [...f.valuesData, ...stringValues],
                hasMore: result.hasMore,
                filterValuesPage: page,
                isFilterLoading: false,
              }
            : f
        )
      );
    } catch (error) {
      setFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, isFilterLoading: false } : f))
      );
    }
  };

  const handleSearchTermChange = (filterId: string, searchTerm: string) => {
    setFilters(
      filters.map((f) => (f.id === filterId ? { ...f, searchTerm } : f))
    );

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const filter = filters.find((f) => f.id === filterId);
      if (filter?.filterKey) {
        await fetchFilterValues(filterId, filter.filterKey, 1, searchTerm);
      }
    }, 500);
  };

  const handleValueSelect = (filterId: string, value: string, isSelected: boolean) => {
    setFilters(
      filters.map((f) =>
        f.id === filterId
          ? {
              ...f,
              filterValues: isSelected
                ? [...f.filterValues, value]
                : f.filterValues.filter((v) => v !== value),
            }
          : f
      )
    );
    setEffectPreview(null);
  };

  const handleSelectAll = (filterId: string) => {
    setFilters(
      filters.map((f) => {
        if (f.id === filterId) {
          const allSelected = f.valuesData.every((value) => f.filterValues.includes(value));
          return {
            ...f,
            filterValues: allSelected ? [] : [...f.valuesData],
          };
        }
        return f;
      })
    );
    setEffectPreview(null);
  };

  const handleLoadMore = async (filterId: string) => {
    const filter = filters.find((f) => f.id === filterId);
    if (filter?.filterKey && filter.hasMore) {
      await fetchFilterValues(
        filterId,
        filter.filterKey,
        filter.filterValuesPage + 1,
        filter.searchTerm || ''
      );
    }
  };

  const handlePreviewEffect = async () => {
    const validFilters = filters.filter(
      (f) => f.filterKey && f.filterValues.length > 0
    );

    if (validFilters.length === 0 && savedCriteria.length === 0) {
      toast.error('Please add at least one filter with selected values');
      return;
    }

    setIsLoadingEffect(true);
    try {
      const allFilters = [
        ...savedCriteria.map((criteria) => ({
          filterKey: criteria.filterKey,
          filterValues: criteria.filterValues,
        })),
        ...validFilters.map((f) => ({
          filterKey: f.filterKey!,
          filterValues: f.filterValues,
        })),
      ];

      const result = await getSelectionCriteriaEffect({
        contactSelectionCriteria: allFilters,
      });

      if (result?.data?.data) {
        const count = result.data.data.count || 0;
        const message = result.data.data.message || `This filter will affect ${count} contacts`;
        setEffectPreview(message);
        setShowSelectionDialog(true);
      }
    } catch (error: any) {
      console.error('Error previewing effect:', error);
      toast.error('Failed to preview filter effect');
    } finally {
      setIsLoadingEffect(false);
    }
  };

  const handleApplySelection = async () => {
    setIsFinalizing(true);
    try {
      const validFilters = filters.filter(
        (f) => f.filterKey && f.filterValues.length > 0
      );

      // Combine saved criteria and current filters
      const filterMap = new Map<string, Set<string>>();
      
      savedCriteria.forEach((criteria) => {
        filterMap.set(criteria.filterKey, new Set(criteria.filterValues));
      });

      validFilters.forEach((filter) => {
        if (!filterMap.has(filter.filterKey!)) {
          filterMap.set(filter.filterKey!, new Set(filter.filterValues));
        } else {
          const valuesSet = filterMap.get(filter.filterKey!)!;
          filter.filterValues.forEach((val) => valuesSet.add(val));
        }
      });

      const formattedFilters = Array.from(filterMap.entries()).map(
        ([filterKey, filterValuesSet]) => ({
          filterKey,
          filterValues: Array.from(filterValuesSet),
        })
      );

      const result = await updateUser({
        contactSelectionCriteria: formattedFilters,
      });

      if (result) {
        await finalizeContacts();
        setShowSelectionDialog(false);
        setFilters([]);
        setEffectPreview(null);
        toast.success('Selection criteria applied successfully');
        await checkUserSession?.();
        onCriteriaChange?.();
      }
    } catch (error: any) {
      console.error('Error applying selection:', error);
      toast.error('Failed to apply selection criteria');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleSaveCriteria = async () => {
    const validFilters = filters.filter(
      (f) => f.filterKey && f.filterValues.length > 0
    );

    if (validFilters.length === 0) {
      toast.error('Please add at least one filter with selected values to save');
      return;
    }

    setIsSaving(true);
    try {
      const newCriteria = validFilters.map((f) => ({
        filterKey: f.filterKey!,
        filterValues: f.filterValues,
      }));

      const updatedCriteria = [...savedCriteria, ...newCriteria];

      const result = await updateUser({
        contactSelectionCriteria: updatedCriteria,
      });

      if (result) {
        setSavedCriteria(updatedCriteria);
        setFilters([]);
        toast.success('Selection criteria saved successfully');
        await checkUserSession?.();
      }
    } catch (error: any) {
      console.error('Error saving criteria:', error);
      toast.error('Failed to save selection criteria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCriteria = async () => {
    if (!criteriaToDelete) return;

    setIsDeletingCriteria(true);
    try {
      const updatedCriteria = savedCriteria.filter((c) => c._id !== criteriaToDelete);
      const result = await updateUser({
        contactSelectionCriteria: updatedCriteria,
      });

      if (result) {
        setSavedCriteria(updatedCriteria);
        toast.success('Criteria deleted successfully');
        await checkUserSession?.();
      }
    } catch (error: any) {
      console.error('Error deleting criteria:', error);
      toast.error('Failed to delete criteria');
    } finally {
      setIsDeletingCriteria(false);
      setCriteriaToDelete(null);
    }
  };

  const validFilters = filters.filter(
    (f) => f.filterKey && f.filterValues.length > 0
  );

  return (
    <>
      <Card>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filter-section" className="border-0">
            <AccordionTrigger className="hover:no-underline px-6 py-4">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between w-full pr-4">
                  <div>
                    <CardTitle className="text-lg">Contact Selection Criteria</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Advanced filtering with AND/OR logic for contact selection
                    </CardDescription>
                  </div>
                  {(validFilters.length > 0 || savedCriteria.length > 0) && (
                    <Badge variant="secondary" className="ml-4">
                      {validFilters.length + savedCriteria.length} active
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4 pt-0">
                {/* Match Type Selection */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Match Type:</Label>
                  <Select value={matchType} onValueChange={(v: 'all' | 'any') => setMatchType(v)}>
                        <SelectTrigger className="w-full sm:w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (AND)</SelectItem>
                      <SelectItem value="any">Any (OR)</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {matchType === 'all'
                      ? 'All filters must match'
                      : 'Any filter can match'}
                  </span>
                </div>

                <Separator />

                {/* Saved Criteria */}
                {savedCriteria.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Saved Filter Criteria</Label>
                    <div className="space-y-2">
                      {savedCriteria.map((criteria, index) => (
                        <div
                          key={criteria._id || index}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{criteria.filterKey}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {criteria.filterValues.length} value(s) selected
                            </div>
                          </div>
                          {!isLocked && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCriteriaToDelete(criteria._id || String(index))}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                )}

                {/* Current Filters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Filter Conditions</Label>
                    {!isLocked && (
                      <Button variant="outline" size="sm" onClick={handleAddFilter}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Filter
                      </Button>
                    )}
                  </div>

                  {filters.map((filter) => (
                    <div
                      key={filter.id}
                      className="space-y-3 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {filter.filterKey || 'New Filter'}
                        </Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFilter(filter.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <Select
                        value={filter.filterKey || ''}
                        onValueChange={(value) => handleFilterKeyChange(filter.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFilterKeys.map((key: string) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {filter.filterKey && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Search values..."
                              value={filter.searchTerm || ''}
                              onChange={(e) => handleSearchTermChange(filter.id, e.target.value)}
                              className="flex-1"
                            />
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={
                                  filter.valuesData.length > 0 &&
                                  filter.valuesData.every((value) =>
                                    filter.filterValues.includes(value)
                                  )
                                }
                                onCheckedChange={() => handleSelectAll(filter.id)}
                              />
                              <Label className="text-sm">Select All</Label>
                            </div>
                          </div>

                          {filter.isFilterLoading && filter.valuesData.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : filter.valuesData.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              No values found
                            </div>
                          ) : (
                            <ScrollArea className="h-[200px] rounded-md border p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filter.valuesData.map((value, idx) => {
                                  const isSelected = filter.filterValues.includes(value);
                                  return (
                                    <div
                                      key={`${value}-${idx}`}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={`${filter.id}-${value}-${idx}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                          handleValueSelect(filter.id, value, checked as boolean)
                                        }
                                      />
                                      <Label
                                        htmlFor={`${filter.id}-${value}-${idx}`}
                                        className="text-sm font-normal cursor-pointer flex-1 truncate"
                                      >
                                        {value}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                              {filter.hasMore && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-4"
                                  onClick={() => handleLoadMore(filter.id)}
                                  disabled={filter.isFilterLoading}
                                >
                                  {filter.isFilterLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    'Load More'
                                  )}
                                </Button>
                              )}
                            </ScrollArea>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {filters.length === 0 && !isLocked && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No filters added. Click "Add Filter" to get started.
                    </div>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <LoadingButton
                    variant="outline"
                    onClick={handlePreviewEffect}
                    disabled={validFilters.length === 0 && savedCriteria.length === 0}
                    loading={isLoadingEffect}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Preview Effect
                  </LoadingButton>

                  {!isLocked && (
                    <LoadingButton
                      variant="outline"
                      onClick={handleSaveCriteria}
                      disabled={validFilters.length === 0}
                      loading={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Criteria
                    </LoadingButton>
                  )}

                  {isLocked && !hasPendingRequest && (
                    <Button variant="outline" onClick={() => setIsRevertDialogOpen(true)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Request Revert
                    </Button>
                  )}
                  {hasPendingRequest && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-2">
                        <RotateCcw className="h-3 w-3" />
                        Revert Request Pending
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCancelRevertDialogOpen(true)}
                        disabled={isCanceling}
                      >
                        Cancel Request
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Selection Effect Dialog */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Confirm Selection Changes
            </DialogTitle>
            <DialogDescription>
              {effectPreview || 'Are you sure you want to proceed with these changes?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSelectionDialog(false)}
              disabled={isFinalizing}
            >
              Cancel
            </Button>
            <LoadingButton onClick={handleApplySelection} loading={isFinalizing}>
              Yes, Proceed
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Criteria Confirmation */}
      <AlertDialog
        open={criteriaToDelete !== null}
        onOpenChange={(open) => !open && setCriteriaToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Criteria?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saved criteria? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCriteria}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingCriteria}
            >
              {isDeletingCriteria ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Request Dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Revert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request to revert finalized contacts? This will allow
              editing the filter criteria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsReverting(true);
                try {
                  await revertContactsFinalize('EDIT_CONTACTS_FILTERS');
                  toast.success('Revert request submitted successfully');
                  setIsRevertDialogOpen(false);
                  await checkUserSession?.();
                } catch (error: any) {
                  toast.error(error?.message || 'Failed to submit revert request');
                } finally {
                  setIsReverting(false);
                }
              }}
              disabled={isReverting}
            >
              {isReverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Revert Request Dialog */}
      <AlertDialog
        open={isCancelRevertDialogOpen}
        onOpenChange={setIsCancelRevertDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Revert Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the pending revert request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsCanceling(true);
                try {
                  await cancelRevertContactsFinalize('EDIT_CONTACTS_FILTERS');
                  toast.success('Revert request cancelled');
                  setIsCancelRevertDialogOpen(false);
                  await checkUserSession?.();
                } catch (error: any) {
                  toast.error(error?.message || 'Failed to cancel revert request');
                } finally {
                  setIsCanceling(false);
                }
              }}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
