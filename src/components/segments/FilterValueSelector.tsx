import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Filter, SegmentFilter } from '@/types/segment';

interface FilterValueSelectorProps {
  field: Filter;
  onApply: (values: any[]) => void;
  isLoading: boolean;
  existingGroup?: SegmentFilter;
  renderSelectAllInHeader?: boolean;
  onSelectAllStateChange?: (state: {
    isSelectAll: boolean;
    isSelectAllVisible: boolean;
    totalCount: number;
    visibleCount: number;
    selectedCount: number;
    handleSelectAll: (checked: boolean) => void;
    handleSelectAllVisible: (checked: boolean) => void;
  }) => void;
}

export function FilterValueSelector({
  field,
  onApply,
  isLoading,
  existingGroup,
  renderSelectAllInHeader = false,
  onSelectAllStateChange,
}: FilterValueSelectorProps) {
  const [values, setValues] = useState<any[]>([]);
  const [selectedValues, setSelectedValues] = useState<any[]>(
    existingGroup?.values || []
  );
  const [loading, setLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isSelectAllVisible, setIsSelectAllVisible] = useState(false);

  useEffect(() => {
    if (field.filterType === 'RADIO' || field.filterType === 'CHECK_BOX') {
      fetchFilterValues();
    }
  }, [field._id]);

  const fetchFilterValues = async (pageNumber = 1, append = false) => {
    if (!field._id) return;

    if (append) {
      setLoadMoreLoading(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await axios.get(
        `/filters/${field._id}/values?pageNumber=${pageNumber}&pageSize=50`
      );

      if (response?.status === 200) {
        const newValues = response.data.data.filterValues || [];
        setValues(append ? [...values, ...newValues] : newValues);
        setHasMore(pageNumber < Math.ceil(response.data.data.totalRecords / 50));
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching filter values:', error);
      toast.error('Failed to load filter values');
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  const filteredValues = values.filter((v) =>
    String(v.value || v).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleValueChange = (value: any) => {
    if (field.filterType === 'RADIO') {
      setSelectedValues([value]);
    } else if (field.filterType === 'CHECK_BOX') {
      setSelectedValues((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
      // Reset select all states when individual checkbox is changed
      setIsSelectAll(false);
      setIsSelectAllVisible(false);
    } else if (field.filterType === 'DROP_DOWN') {
      setSelectedValues([value]);
    }
  };

  const handleSelectAll = useCallback((checked: boolean) => {
    setIsSelectAll(checked);
    setIsSelectAllVisible(false);
    if (checked) {
      // Select all loaded values
      setSelectedValues(values.map((v) => v.value || v));
    } else {
      setSelectedValues([]);
    }
  }, [values]);

  const handleSelectAllVisible = useCallback((checked: boolean) => {
    setIsSelectAllVisible(checked);
    setIsSelectAll(false);
    if (checked) {
      // Select only filtered/visible values
      const visibleValues = filteredValues.map((v) => v.value || v);
      // Merge with existing selected values that are not in visible list
      setSelectedValues((prev) => {
        const existingNotVisible = prev.filter((sv) => !visibleValues.includes(sv));
        return [...existingNotVisible, ...visibleValues];
      });
    } else {
      // Deselect only the visible values
      const visibleValues = filteredValues.map((v) => v.value || v);
      setSelectedValues((prev) => prev.filter((sv) => !visibleValues.includes(sv)));
    }
  }, [filteredValues]);

  // Store handlers in refs to avoid recreating the callback object
  const handleSelectAllRef = useRef(handleSelectAll);
  const handleSelectAllVisibleRef = useRef(handleSelectAllVisible);

  useEffect(() => {
    handleSelectAllRef.current = handleSelectAll;
    handleSelectAllVisibleRef.current = handleSelectAllVisible;
  }, [handleSelectAll, handleSelectAllVisible]);

  // Report state to parent for header rendering
  useEffect(() => {
    if (onSelectAllStateChange && field.filterType === 'CHECK_BOX') {
      onSelectAllStateChange({
        isSelectAll,
        isSelectAllVisible,
        totalCount: values.length,
        visibleCount: filteredValues.length,
        selectedCount: selectedValues.length,
        handleSelectAll: (checked: boolean) => handleSelectAllRef.current(checked),
        handleSelectAllVisible: (checked: boolean) => handleSelectAllVisibleRef.current(checked),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectAll, isSelectAllVisible, values.length, filteredValues.length, selectedValues.length, field.filterType]);

  const handleApply = () => {
    if (selectedValues.length === 0) {
      toast.error('Please select at least one value');
      return;
    }
    onApply(selectedValues);
  };

  if (field.filterType === 'INPUT') {
    return null; // INPUT uses ConditionBuilder
  }

  return (
    <div className="space-y-4">
      {field.filterType === 'RADIO' && (
        <RadioGroup
          value={selectedValues[0] || ''}
          onValueChange={(value) => handleValueChange(value)}
        >
          {filteredValues.map((val, index) => {
            const value = val.value || val;
            const label = val.label || value;
            return (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={String(value)} id={`radio-${index}`} />
                <Label htmlFor={`radio-${index}`} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      )}

      {field.filterType === 'DROP_DOWN' && (
        <div className="space-y-2">
          <Select
            value={selectedValues[0] || ''}
            onValueChange={(value) => handleValueChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a value" />
            </SelectTrigger>
            <SelectContent>
              {filteredValues.map((val, index) => {
                const value = val.value || val;
                const label = val.label || value;
                return (
                  <SelectItem key={index} value={String(value)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {field.filterType === 'CHECK_BOX' && (
        <div className="space-y-2">
          <Input
            placeholder="Search values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          {/* Select All Options - only show if not rendered in header */}
          {!renderSelectAllInHeader && (
            <div className="flex items-center gap-4 py-2 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`select-all-${field._id}`}
                  checked={isSelectAll}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <Label htmlFor={`select-all-${field._id}`} className="cursor-pointer text-sm font-medium">
                  Select All ({values.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`select-visible-${field._id}`}
                  checked={isSelectAllVisible}
                  onCheckedChange={(checked) => handleSelectAllVisible(checked as boolean)}
                />
                <Label htmlFor={`select-visible-${field._id}`} className="cursor-pointer text-sm font-medium">
                  Select All Visible ({filteredValues.length})
                </Label>
              </div>
              {selectedValues.length > 0 && (
                <span className="text-sm text-muted-foreground ml-auto">
                  {selectedValues.length} selected
                </span>
              )}
            </div>
          )}
          <div className="max-h-[400px] overflow-y-auto border rounded-md p-3">
            {loading && values.length === 0 ? (
              <LoadingState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredValues.map((val, index) => {
                  const value = val.value || val;
                  const label = val.label || value;
                  const isSelected = selectedValues.includes(value);

                  return (
                    <div key={index} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id={`checkbox-${field._id}-${index}`}
                        checked={isSelected}
                        onCheckedChange={() => handleValueChange(value)}
                      />
                      <Label htmlFor={`checkbox-${field._id}-${index}`} className="cursor-pointer text-sm truncate">
                        {label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {hasMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchFilterValues(page + 1, true)}
              disabled={loadMoreLoading}
            >
              {loadMoreLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load More
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleApply}
          disabled={isLoading || selectedValues.length === 0}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Applying...' : existingGroup ? 'Update' : 'Apply'}
        </Button>
      </div>
    </div>
  );
}
