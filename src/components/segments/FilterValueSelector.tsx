import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import axios from '@/lib/api';
import { toast } from 'sonner';
import type { Filter, SegmentFilter } from '@/types/segment';

interface FilterValueSelectorProps {
  field: Filter;
  onApply: (values: any[]) => void;
  isLoading: boolean;
  existingGroup?: SegmentFilter;
}

export function FilterValueSelector({
  field,
  onApply,
  isLoading,
  existingGroup,
}: FilterValueSelectorProps) {
  const [values, setValues] = useState<any[]>([]);
  const [selectedValues, setSelectedValues] = useState<any[]>(
    existingGroup?.values || []
  );
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (field.filterType === 'RADIO' || field.filterType === 'CHECK_BOX') {
      fetchFilterValues();
    }
  }, [field._id]);

  const fetchFilterValues = async (pageNumber = 1, append = false) => {
    if (!field._id) return;

    setLoading(true);
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
    } else if (field.filterType === 'DROP_DOWN') {
      setSelectedValues([value]);
    }
  };

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

      {(field.filterType === 'CHECK_BOX' || field.filterType === 'DROP_DOWN') && (
        <div className="space-y-2">
          {field.filterType === 'CHECK_BOX' && (
            <Input
              placeholder="Search values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          )}
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {loading && values.length === 0 ? (
              <LoadingState />
            ) : (
              filteredValues.map((val, index) => {
                const value = val.value || val;
                const label = val.label || value;
                const isSelected = selectedValues.includes(value);

                if (field.filterType === 'CHECK_BOX') {
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`checkbox-${index}`}
                        checked={isSelected}
                        onCheckedChange={() => handleValueChange(value)}
                      />
                      <Label htmlFor={`checkbox-${index}`} className="cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded border cursor-pointer ${
                        isSelected ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => handleValueChange(value)}
                    >
                      {label}
                    </div>
                  );
                }
              })
            )}
          </div>
          {hasMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchFilterValues(page + 1, true)}
              disabled={loading}
            >
              Load More
            </Button>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={handleApply}
        disabled={isLoading || selectedValues.length === 0}
      >
        {isLoading ? 'Applying...' : existingGroup ? 'Update' : 'Apply'}
      </Button>
    </div>
  );
}
