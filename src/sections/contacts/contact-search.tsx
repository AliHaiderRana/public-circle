import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search, Loader2 } from 'lucide-react';
import { type ContactFilter } from '@/actions/contacts';
import { getContactFilterValues } from '@/actions/contacts';

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----------------------------------------------------------------------

interface ContactSearchProps {
  searchFilters: ContactFilter[];
  setSearchFilters: (filters: ContactFilter[]) => void;
  filterKeysData: any;
  invalidEmailsChecked: boolean;
  setInvalidEmailsChecked: (checked: boolean) => void;
  unsubscribedChecked: boolean;
  setUnsubscribedChecked: (checked: boolean) => void;
  applePrivateContactsChecked: boolean;
  setApplePrivateContactsChecked: (checked: boolean) => void;
  complaintUsersChecked: boolean;
  setComplaintUsersChecked: (checked: boolean) => void;
  onApplyFilters: () => void;
}

export function ContactSearch({
  searchFilters,
  setSearchFilters,
  filterKeysData,
  invalidEmailsChecked,
  setInvalidEmailsChecked,
  unsubscribedChecked,
  setUnsubscribedChecked,
  applePrivateContactsChecked,
  setApplePrivateContactsChecked,
  complaintUsersChecked,
  setComplaintUsersChecked,
  onApplyFilters,
}: ContactSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleAddFilter = () => {
    setSearchFilters([
      ...searchFilters,
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
    setSearchFilters(searchFilters.filter((f) => f.id !== filterId));
  };

  const handleFilterKeyChange = async (filterId: string, filterKey: string) => {
    const updatedFilters = searchFilters.map((f) =>
      f.id === filterId
        ? {
            ...f,
            filterKey,
            filterValues: [],
            valuesData: [],
            filterValuesPage: 1,
            hasMore: true,
          }
        : f
    );
    setSearchFilters(updatedFilters);
    
    // Fetch values for the new filter key
    if (filterKey) {
      await fetchFilterValues(filterId, '');
    }
  };

  const handleSearchTermChange = (filterId: string, searchTerm: string) => {
    setSearchFilters(
      searchFilters.map((f) => (f.id === filterId ? { ...f, searchTerm } : f))
    );

    // Debounce filter value fetch
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setSearchFilters((prev) => {
        const filter = prev.find((f) => f.id === filterId);
        if (filter?.filterKey) {
          fetchFilterValues(filterId, searchTerm);
        }
        return prev;
      });
    }, 500);
  };

  const fetchFilterValues = async (filterId: string, searchTerm: string = '') => {
    setSearchFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, isFilterLoading: true } : f))
    );

    const filter = searchFilters.find((f) => f.id === filterId);
    if (!filter?.filterKey) {
      setSearchFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, isFilterLoading: false } : f))
      );
      return;
    }

    try {
      const result = await getContactFilterValues(filter.filterKey, searchTerm, 1);
      setSearchFilters((prev) =>
        prev.map((f) =>
          f.id === filterId
            ? {
                ...f,
                valuesData: result.values,
                hasMore: result.hasMore,
                isFilterLoading: false,
              }
            : f
        )
      );
    } catch (error) {
      setSearchFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, isFilterLoading: false } : f))
      );
    }
  };

  const handleFilterValueChange = (filterId: string, values: string[]) => {
    setSearchFilters(
      searchFilters.map((f) =>
        f.id === filterId ? { ...f, filterValues: values, valuesData: values } : f
      )
    );
  };

  const handleResetFilters = () => {
    setSearchFilters([]);
    setInvalidEmailsChecked(false);
    setUnsubscribedChecked(false);
    setApplePrivateContactsChecked(false);
    setComplaintUsersChecked(false);
  };

  const availableFilterKeys = filterKeysData?.data || [];

  return (
    <Card>
      <Accordion type="single" collapsible value={isOpen ? 'search' : undefined}>
        <AccordionItem value="search" className="border-0">
          <AccordionTrigger
            onClick={() => setIsOpen(!isOpen)}
            className="hover:no-underline px-6 py-4"
          >
            <CardHeader className="p-0">
              <div className="flex items-center justify-between w-full pr-4">
                <CardTitle className="text-lg">Search & Filters</CardTitle>
                {(searchFilters.length > 0 ||
                  invalidEmailsChecked ||
                  unsubscribedChecked ||
                  applePrivateContactsChecked ||
                  complaintUsersChecked) && (
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-4">
              {/* Quick Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Filters</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="invalid-emails"
                      checked={invalidEmailsChecked}
                      onCheckedChange={(checked) => setInvalidEmailsChecked(checked as boolean)}
                    />
                    <Label htmlFor="invalid-emails" className="text-sm font-normal">
                      Invalid Emails
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unsubscribed"
                      checked={unsubscribedChecked}
                      onCheckedChange={(checked) => setUnsubscribedChecked(checked as boolean)}
                    />
                    <Label htmlFor="unsubscribed" className="text-sm font-normal">
                      Unsubscribed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apple-private"
                      checked={applePrivateContactsChecked}
                      onCheckedChange={(checked) =>
                        setApplePrivateContactsChecked(checked as boolean)
                      }
                    />
                    <Label htmlFor="apple-private" className="text-sm font-normal">
                      Apple Private Relay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="complaint-users"
                      checked={complaintUsersChecked}
                      onCheckedChange={(checked) => setComplaintUsersChecked(checked as boolean)}
                    />
                    <Label htmlFor="complaint-users" className="text-sm font-normal">
                      Complaint Users
                    </Label>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Advanced Filters</Label>
                  <Button variant="outline" size="sm" onClick={handleAddFilter}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>

                {searchFilters.map((filter) => (
                  <div key={filter.id} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
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
                        <>
                          <Input
                            placeholder="Search values..."
                            value={filter.searchTerm || ''}
                            onChange={(e) => handleSearchTermChange(filter.id, e.target.value)}
                            className="w-full"
                          />
                          <Select
                            value={filter.filterValues[0] || ''}
                            onValueChange={(value) =>
                              handleFilterValueChange(filter.id, [value])
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              {filter.isFilterLoading ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                filter.valuesData.map((value: string) => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFilter(filter.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Apply Button */}
              {(searchFilters.length > 0 ||
                invalidEmailsChecked ||
                unsubscribedChecked ||
                applePrivateContactsChecked ||
                complaintUsersChecked) && (
                <Button onClick={onApplyFilters} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
