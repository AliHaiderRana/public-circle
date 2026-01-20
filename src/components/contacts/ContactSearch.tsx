import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search, ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { getFilterKeys, getContactFilterValues, type ContactFilter } from '@/actions/contacts';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface ContactSearchProps {
  searchFilters: ContactFilter[];
  setSearchFilters: (filters: ContactFilter[]) => void;
  invalidEmailsChecked: boolean;
  setInvalidEmailsChecked: (checked: boolean) => void;
  unsubscribedChecked: boolean;
  setUnsubscribedChecked: (checked: boolean) => void;
  applePrivateChecked: boolean;
  setApplePrivateChecked: (checked: boolean) => void;
  complaintUsersChecked: boolean;
  setComplaintUsersChecked: (checked: boolean) => void;
  onFiltersChange: () => void;
}

export function ContactSearch({
  searchFilters,
  setSearchFilters,
  invalidEmailsChecked,
  setInvalidEmailsChecked,
  unsubscribedChecked,
  setUnsubscribedChecked,
  applePrivateChecked,
  setApplePrivateChecked,
  complaintUsersChecked,
  setComplaintUsersChecked,
  onFiltersChange,
}: ContactSearchProps) {
  const { filterKeys } = getFilterKeys();
  const [isOpen, setIsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any[]>>({});
  const [loadingValues, setLoadingValues] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchFilterValues = async (key: string, searchTerm = '', page = 1) => {
    setLoadingValues((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await getContactFilterValues(key, searchTerm, page);
      setFilterValues((prev) => ({
        ...prev,
        [key]: response.values || [],
      }));
    } catch (error) {
      console.error('Error fetching filter values:', error);
    } finally {
      setLoadingValues((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAddFilter = () => {
    setSearchFilters([
      ...searchFilters,
      {
        id: Date.now().toString(),
        filterKey: null,
        filterValues: [],
        valuesData: [],
        searchTerm: '',
      },
    ]);
  };

  const handleRemoveFilter = (id: string) => {
    setSearchFilters(searchFilters.filter((f) => f.id !== id));
    onFiltersChange();
  };

  const handleFilterKeyChange = (id: string, key: string) => {
    setSearchFilters(
      searchFilters.map((f) =>
        f.id === id
          ? {
              ...f,
              filterKey: key,
              filterValues: [],
              valuesData: [],
              searchTerm: '',
            }
          : f
      )
    );
    if (key) {
      fetchFilterValues(key);
    }
  };

  const handleFilterValueToggle = (id: string, value: string, checked: boolean) => {
    setSearchFilters(
      searchFilters.map((f) => {
        if (f.id === id) {
          const newValues = checked
            ? [...f.filterValues, value]
            : f.filterValues.filter((v) => v !== value);
          return { ...f, filterValues: newValues };
        }
        return f;
      })
    );
    onFiltersChange();
  };

  const handleSelectAll = (id: string) => {
    const filter = searchFilters.find((f) => f.id === id);
    if (!filter || !filter.filterKey) return;

    const availableValues = filterValues[filter.filterKey] || [];
    const allSelected = availableValues.every((val: any) =>
      filter.filterValues.includes(String(val.value || val))
    );

    setSearchFilters(
      searchFilters.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            filterValues: allSelected
              ? []
              : availableValues.map((val: any) => String(val.value || val)),
          };
        }
        return f;
      })
    );
    onFiltersChange();
  };

  const handleResetFilters = () => {
    setSearchFilters([]);
    setInvalidEmailsChecked(false);
    setUnsubscribedChecked(false);
    setApplePrivateChecked(false);
    setComplaintUsersChecked(false);
    onFiltersChange();
  };

  const activeFiltersCount =
    searchFilters.filter((f) => f.filterKey && f.filterValues.length > 0).length +
    (invalidEmailsChecked ? 1 : 0) +
    (unsubscribedChecked ? 1 : 0) +
    (applePrivateChecked ? 1 : 0) +
    (complaintUsersChecked ? 1 : 0);

  const hasActiveFilters =
    invalidEmailsChecked ||
    unsubscribedChecked ||
    applePrivateChecked ||
    complaintUsersChecked ||
    searchFilters.length > 0;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="font-semibold">Search Contacts</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            {/* Quick Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Use this function to search through your data.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="complaint-users"
                    checked={complaintUsersChecked}
                    onCheckedChange={(checked) => {
                      setComplaintUsersChecked(checked as boolean);
                      onFiltersChange();
                    }}
                  />
                  <Label htmlFor="complaint-users" className="cursor-pointer text-sm">
                    Contacts Who Complained
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unsubscribed"
                    checked={unsubscribedChecked}
                    onCheckedChange={(checked) => {
                      setUnsubscribedChecked(checked as boolean);
                      onFiltersChange();
                    }}
                  />
                  <Label htmlFor="unsubscribed" className="cursor-pointer text-sm">
                    Unsubscribed Contacts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invalid-emails"
                    checked={invalidEmailsChecked}
                    onCheckedChange={(checked) => {
                      setInvalidEmailsChecked(checked as boolean);
                      onFiltersChange();
                    }}
                  />
                  <Label htmlFor="invalid-emails" className="cursor-pointer text-sm">
                    Invalid Emails
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apple-private"
                    checked={applePrivateChecked}
                    onCheckedChange={(checked) => {
                      setApplePrivateChecked(checked as boolean);
                      onFiltersChange();
                    }}
                  />
                  <Label htmlFor="apple-private" className="cursor-pointer text-sm">
                    Apple Private Contacts
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddFilter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Search Fields
                </Button>
              </div>
            </div>

            {/* Filter Cards */}
            <div className="space-y-4">
              {searchFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">
                      {filter.filterKey || 'New Filter'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFilter(filter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Select
                    value={filter.filterKey || ''}
                    onValueChange={(value) => handleFilterKeyChange(filter.id, value)}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Choose a field to filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterKeys.map((key: string) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {filter.filterKey && (
                    <div className="mt-4">
                      <div className="flex items-center justify-end gap-4 mb-3">
                        <Input
                          placeholder="Search values..."
                          value={filter.searchTerm || ''}
                          onChange={(e) => {
                            const searchTerm = e.target.value;
                            setSearchFilters(
                              searchFilters.map((f) =>
                                f.id === filter.id ? { ...f, searchTerm } : f
                              )
                            );
                            if (debounceRef.current) clearTimeout(debounceRef.current);
                            debounceRef.current = setTimeout(() => {
                              fetchFilterValues(filter.filterKey!, searchTerm);
                            }, 300);
                          }}
                          className="max-w-[200px] h-9"
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-all-${filter.id}`}
                            checked={
                              filterValues[filter.filterKey]?.length > 0 &&
                              filterValues[filter.filterKey]?.every((val: any) =>
                                filter.filterValues.includes(String(val.value || val))
                              )
                            }
                            onCheckedChange={() => handleSelectAll(filter.id)}
                          />
                          <Label
                            htmlFor={`select-all-${filter.id}`}
                            className="cursor-pointer text-sm"
                          >
                            Select All
                          </Label>
                        </div>
                      </div>

                      <div className="text-center">
                        {loadingValues[filter.filterKey] &&
                        !filterValues[filter.filterKey]?.length ? (
                          <div className="py-4">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </div>
                        ) : !filterValues[filter.filterKey]?.length ? (
                          <p className="text-sm text-muted-foreground py-4">
                            No values found
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                            {filterValues[filter.filterKey]?.map((val: any, index: number) => {
                              const value = String(val.value || val);
                              const label = val.label || value;
                              return (
                                <div
                                  key={`${value}-${index}`}
                                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                                >
                                  <Checkbox
                                    id={`${filter.id}-${value}`}
                                    checked={filter.filterValues.includes(value)}
                                    onCheckedChange={(checked) =>
                                      handleFilterValueToggle(
                                        filter.id,
                                        value,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`${filter.id}-${value}`}
                                    className="cursor-pointer text-sm truncate flex-1"
                                    title={label}
                                  >
                                    {label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {hasActiveFilters && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset Search
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
