import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search } from 'lucide-react';
import { getFilterKeys, getContactFilterValues, type ContactFilter } from '@/actions/contacts';
import { useDebounce } from '@/hooks/use-debounce';

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
  const [filterValueSearch, setFilterValueSearch] = useState<Record<string, string>>({});
  const [filterValues, setFilterValues] = useState<Record<string, any[]>>({});
  const [loadingValues, setLoadingValues] = useState<Record<string, boolean>>({});

  const debouncedSearch = useDebounce(async (key: string, searchTerm: string) => {
    if (key) {
      await fetchFilterValues(key, searchTerm);
    }
  }, 300);

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

  const handleFilterValueChange = (id: string, values: string[]) => {
    setSearchFilters(
      searchFilters.map((f) => (f.id === id ? { ...f, filterValues: values } : f))
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
    searchFilters.length +
    (invalidEmailsChecked ? 1 : 0) +
    (unsubscribedChecked ? 1 : 0) +
    (applePrivateChecked ? 1 : 0) +
    (complaintUsersChecked ? 1 : 0);

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="search">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search & Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-4 pt-0">
              {/* Quick Filters */}
              <div className="space-y-2">
                <Label>Quick Filters</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="invalid-emails"
                      checked={invalidEmailsChecked}
                      onCheckedChange={setInvalidEmailsChecked}
                    />
                    <Label htmlFor="invalid-emails" className="cursor-pointer">
                      Invalid Emails
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unsubscribed"
                      checked={unsubscribedChecked}
                      onCheckedChange={setUnsubscribedChecked}
                    />
                    <Label htmlFor="unsubscribed" className="cursor-pointer">
                      Unsubscribed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apple-private"
                      checked={applePrivateChecked}
                      onCheckedChange={setApplePrivateChecked}
                    />
                    <Label htmlFor="apple-private" className="cursor-pointer">
                      Apple Private Relay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="complaint-users"
                      checked={complaintUsersChecked}
                      onCheckedChange={setComplaintUsersChecked}
                    />
                    <Label htmlFor="complaint-users" className="cursor-pointer">
                      Complaint Users
                    </Label>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Advanced Filters</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddFilter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" size="sm" onClick={handleResetFilters}>
                        Reset All
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {searchFilters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-2">
                      <Select
                        value={filter.filterKey}
                        onValueChange={(value) => handleFilterKeyChange(filter.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Select field" />
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
                        <>
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
                              debouncedSearch(filter.filterKey!, searchTerm);
                            }}
                            className="flex-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {filter.filterValues.map((value) => (
                                <Badge key={value} variant="secondary" className="gap-1">
                                  {value}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleFilterValueChange(
                                        filter.id,
                                        filter.filterValues.filter((v) => v !== value)
                                      )
                                    }
                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (!filter.filterValues.includes(value)) {
                                  handleFilterValueChange(filter.id, [
                                    ...filter.filterValues,
                                    value,
                                  ]);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select value(s)" />
                              </SelectTrigger>
                              <SelectContent>
                                {filterValues[filter.filterKey!]
                                  ?.filter(
                                    (val: any) =>
                                      !filter.filterValues.includes(String(val.value || val))
                                  )
                                  ?.map((val: any) => {
                                    const value = val.value || val;
                                    const label = val.label || value;
                                    return (
                                      <SelectItem key={value} value={String(value)}>
                                        {label}
                                      </SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

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
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
