import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Filter, Save, Loader2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getSelectionCriteriaEffect, finalizeContacts } from '@/actions/contacts';
import { getContactFilterValues } from '@/actions/contacts';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { type ContactFilter } from '@/actions/contacts';

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----------------------------------------------------------------------

interface FilterCondition {
  id: string;
  filterKey: string | null;
  filterValues: string[];
  valuesData: string[];
  filterValuesPage: number;
  hasMore: boolean;
  searchTerm: string;
  isFilterLoading: boolean;
}

interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

interface FilterSectionProps {
  searchFilters: ContactFilter[];
  setSearchFilters: (filters: ContactFilter[]) => void;
  filterKeysData: any;
  onFiltersChange: () => void;
}

export function FilterSection({
  searchFilters,
  setSearchFilters,
  filterKeysData,
  onFiltersChange,
}: FilterSectionProps) {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [groupLogic, setGroupLogic] = useState<'AND' | 'OR'>('AND');
  const [showEffectDialog, setShowEffectDialog] = useState(false);
  const [effectData, setEffectData] = useState<string | null>(null);
  const [isLoadingEffect, setIsLoadingEffect] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [savedCriteria, setSavedCriteria] = useState<string[][]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();

  const availableKeys = filterKeysData?.data || [];

  // Load saved criteria from user company
  useEffect(() => {
    if (user?.company?.contactSelectionCriteria) {
      setSavedCriteria(user.company.contactSelectionCriteria);
    }
  }, [user]);

  const handleAddGroup = () => {
    setFilterGroups([
      ...filterGroups,
      {
        id: uuidv4(),
        conditions: [
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
        ],
        logic: 'AND',
      },
    ]);
  };

  const handleRemoveGroup = (groupId: string) => {
    setFilterGroups(filterGroups.filter((g) => g.id !== groupId));
  };

  const handleAddCondition = (groupId: string) => {
    setFilterGroups(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [
                ...g.conditions,
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
              ],
            }
          : g
      )
    );
  };

  const handleRemoveCondition = (groupId: string, conditionId: string) => {
    setFilterGroups(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.filter((c) => c.id !== conditionId),
            }
          : g
      )
    );
  };

  const handleConditionKeyChange = async (
    groupId: string,
    conditionId: string,
    filterKey: string
  ) => {
    setFilterGroups(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId
                  ? {
                      ...c,
                      filterKey,
                      filterValues: [],
                      valuesData: [],
                      filterValuesPage: 1,
                      hasMore: true,
                    }
                  : c
              ),
            }
          : g
      )
    );

    // Fetch values for the new filter key
    if (filterKey) {
      await fetchConditionValues(groupId, conditionId, filterKey, '');
    }
  };

  const handleConditionSearchChange = (groupId: string, conditionId: string, searchTerm: string) => {
    setFilterGroups(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, searchTerm } : c
              ),
            }
          : g
      )
    );

    // Debounce filter value fetch
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const group = filterGroups.find((g) => g.id === groupId);
      const condition = group?.conditions.find((c) => c.id === conditionId);
      if (condition?.filterKey) {
        await fetchConditionValues(groupId, conditionId, condition.filterKey, searchTerm);
      }
    }, 500);
  };

  const fetchConditionValues = async (
    groupId: string,
    conditionId: string,
    filterKey: string,
    searchTerm: string = ''
  ) => {
    setFilterGroups(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, isFilterLoading: true } : c
              ),
            }
          : g
      )
    );

    try {
      const result = await getContactFilterValues(filterKey, searchTerm, 1);
      setFilterGroups(
        filterGroups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.map((c) =>
                  c.id === conditionId
                    ? {
                        ...c,
                        valuesData: result.values,
                        hasMore: result.hasMore,
                        isFilterLoading: false,
                      }
                    : c
                ),
              }
            : g
        )
      );
    } catch (error) {
      setFilterGroups(
        filterGroups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.map((c) =>
                  c.id === conditionId ? { ...c, isFilterLoading: false } : c
                ),
              }
            : g
        )
      );
    }
  };

  const handleConditionValueChange = (
    groupId: string,
    conditionId: string,
    values: string[]
  ) => {
    setFilterGroups(
      filterGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, filterValues: values } : c
              ),
            }
          : g
      )
    );
  };

  const handleGroupLogicChange = (groupId: string, logic: 'AND' | 'OR') => {
    setFilterGroups(
      filterGroups.map((g) => (g.id === groupId ? { ...g, logic } : g))
    );
  };

  const getFilterCriteria = (): string[] => {
    const criteria: string[] = [];
    filterGroups.forEach((group) => {
      group.conditions.forEach((condition) => {
        if (condition.filterKey && condition.filterValues.length > 0) {
          condition.filterValues.forEach((value) => {
            criteria.push(`${condition.filterKey}:${value}`);
          });
        }
      });
    });
    return criteria;
  };

  const handlePreviewEffect = async () => {
    const criteria = getFilterCriteria();
    if (criteria.length === 0) {
      toast.error('Please add at least one filter condition');
      return;
    }

    setIsLoadingEffect(true);
    try {
      const result = await getSelectionCriteriaEffect({
        contactSelectionCriteria: criteria,
      });
      if (result?.data?.message) {
        setEffectData(result.data.message);
        setShowEffectDialog(true);
      }
    } catch (error) {
      console.error('Error getting selection effect:', error);
      toast.error('Failed to get filter effect');
    } finally {
      setIsLoadingEffect(false);
    }
  };

  const handleApplyFilters = async () => {
    const criteria = getFilterCriteria();
    if (criteria.length === 0) {
      toast.error('Please add at least one filter condition');
      return;
    }

    setIsApplying(true);
    try {
      // Convert filter groups to ContactFilter format
      const newFilters: ContactFilter[] = [];
      filterGroups.forEach((group) => {
        group.conditions.forEach((condition) => {
          if (condition.filterKey && condition.filterValues.length > 0) {
            newFilters.push({
              id: condition.id,
              filterKey: condition.filterKey,
              filterValues: condition.filterValues,
              valuesData: condition.filterValues,
              filterValuesPage: 1,
              hasMore: false,
              searchTerm: condition.searchTerm,
              isFilterLoading: false,
            });
          }
        });
      });

      setSearchFilters(newFilters);
      setIsOpen(false);
      onFiltersChange();
      toast.success('Filters applied successfully');
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setIsApplying(false);
    }
  };

  const handleLoadSavedCriteria = (criteria: string[]) => {
    // Parse saved criteria and populate filter groups
    const groups: FilterGroup[] = [];
    const group: FilterGroup = {
      id: uuidv4(),
      conditions: [],
      logic: 'AND',
    };

    criteria.forEach((criterion) => {
      const [key, value] = criterion.split(':');
      if (key && value) {
        group.conditions.push({
          id: uuidv4(),
          filterKey: key,
          filterValues: [value],
          valuesData: [value],
          filterValuesPage: 1,
          hasMore: false,
          searchTerm: '',
          isFilterLoading: false,
        });
      }
    });

    if (group.conditions.length > 0) {
      groups.push(group);
      setFilterGroups(groups);
    }
  };

  return (
    <>
      <Card>
        <Accordion type="single" collapsible value={isOpen ? 'filter-section' : undefined}>
          <AccordionItem value="filter-section" className="border-0">
            <AccordionTrigger
              onClick={() => setIsOpen(!isOpen)}
              className="hover:no-underline px-6 py-4"
            >
              <CardHeader className="p-0">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <CardTitle className="text-lg">Advanced Filters</CardTitle>
                    {filterGroups.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filterGroups.reduce((sum, g) => sum + g.conditions.length, 0)} conditions
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                {/* Saved Criteria */}
                {savedCriteria.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Saved Criteria</Label>
                    <div className="flex flex-wrap gap-2">
                      {savedCriteria.map((criteria, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleLoadSavedCriteria(criteria)}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Criteria {index + 1}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Logic Selector */}
                {filterGroups.length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Group Logic</Label>
                    <RadioGroup
                      value={groupLogic}
                      onValueChange={(value) => setGroupLogic(value as 'AND' | 'OR')}
                      className="flex flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="AND" id="and" />
                        <Label htmlFor="and" className="cursor-pointer">
                          AND (all groups must match)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="OR" id="or" />
                        <Label htmlFor="or" className="cursor-pointer">
                          OR (any group can match)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Filter Groups */}
                <div className="space-y-4">
                  {filterGroups.map((group, groupIndex) => (
                    <Card key={group.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            Filter Group {groupIndex + 1}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {group.conditions.length > 1 && (
                              <RadioGroup
                                value={group.logic}
                                onValueChange={(value) =>
                                  handleGroupLogicChange(group.id, value as 'AND' | 'OR')
                                }
                                className="flex flex-row gap-2"
                              >
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="AND" id={`and-${group.id}`} />
                                  <Label htmlFor={`and-${group.id}`} className="text-xs cursor-pointer">
                                    AND
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="OR" id={`or-${group.id}`} />
                                  <Label htmlFor={`or-${group.id}`} className="text-xs cursor-pointer">
                                    OR
                                  </Label>
                                </div>
                              </RadioGroup>
                            )}
                            {filterGroups.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveGroup(group.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {group.conditions.map((condition, conditionIndex) => (
                          <div
                            key={condition.id}
                            className="flex items-start gap-2 p-3 border rounded-lg"
                          >
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <Select
                                value={condition.filterKey || ''}
                                onValueChange={(value) =>
                                  handleConditionKeyChange(group.id, condition.id, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableKeys.map((key: string) => (
                                    <SelectItem key={key} value={key}>
                                      {key}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {condition.filterKey && (
                                <>
                                  <Input
                                    placeholder="Search values..."
                                    value={condition.searchTerm || ''}
                                    onChange={(e) =>
                                      handleConditionSearchChange(
                                        group.id,
                                        condition.id,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <Select
                                    value={condition.filterValues[0] || ''}
                                    onValueChange={(value) =>
                                      handleConditionValueChange(group.id, condition.id, [value])
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {condition.isFilterLoading ? (
                                        <div className="flex items-center justify-center p-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                      ) : (
                                        condition.valuesData.map((value: string) => (
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
                            {group.conditions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCondition(group.id, condition.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCondition(group.id)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Condition
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  {filterGroups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No filter groups yet. Add one to get started.</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleAddGroup}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter Group
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviewEffect}
                      disabled={isLoadingEffect || filterGroups.length === 0}
                    >
                      {isLoadingEffect ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Info className="h-4 w-4 mr-2" />
                          Preview Effect
                        </>
                      )}
                    </Button>
                    <Button onClick={handleApplyFilters} disabled={isApplying}>
                      {isApplying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Filter className="h-4 w-4 mr-2" />
                          Apply Filters
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Effect Preview Dialog */}
      <Dialog open={showEffectDialog} onOpenChange={setShowEffectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Effect Preview</DialogTitle>
            <DialogDescription>
              This shows how many contacts will match your filter criteria
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {effectData ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-wrap">{effectData}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">No effect data available</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEffectDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
