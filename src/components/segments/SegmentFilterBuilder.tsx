import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { Filter, SegmentFilter } from '@/types/segment';
import { getAllFilters } from '@/actions/filters';
import { getUserCount } from '@/actions/segments';
import { FilterValueSelector } from './FilterValueSelector';
import { ConditionBuilder } from './ConditionBuilder';

interface SegmentFilterBuilderProps {
  allFilters: Filter[];
  selectedFields: Filter[];
  setSelectedFields: (fields: Filter[]) => void;
  selectedGroups: SegmentFilter[];
  setSelectedGroups: (groups: SegmentFilter[]) => void;
  totalCount: number;
  setTotalCount: (count: number) => void;
}

export function SegmentFilterBuilder({
  allFilters,
  selectedFields,
  setSelectedFields,
  selectedGroups,
  setSelectedGroups,
  totalCount,
  setTotalCount,
}: SegmentFilterBuilderProps) {
  const [fieldToAdd, setFieldToAdd] = useState<string>('');
  const [loadingFieldCount, setLoadingFieldCount] = useState<Record<string, boolean>>({});

  const availableFields = useMemo(() => {
    const selectedIds = new Set(selectedFields.map((f) => f._id));
    return allFilters.filter((f) => !selectedIds.has(f._id));
  }, [allFilters, selectedFields]);

  const handleAddField = () => {
    if (!fieldToAdd) {
      toast.error('Please select a field to add');
      return;
    }

    const field = allFilters.find((f) => f._id === fieldToAdd);
    if (field) {
      setSelectedFields([...selectedFields, field]);
      setFieldToAdd('');
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter((f) => f._id !== fieldId));
    setSelectedGroups(selectedGroups.filter((g) => g.fieldId !== fieldId));
  };

  const handleApplyFilter = async (
    field: Filter,
    values: any[],
    conditions: any[],
    operator: 'AND' | 'OR'
  ) => {
    setLoadingFieldCount((prev) => ({ ...prev, [field._id]: true }));

    try {
      const newSelectedGroups = selectedGroups.filter((g) => g.fieldId !== field._id);
      const response = await getUserCount(
        field.filterKey,
        values,
        conditions.length > 0 ? conditions : null,
        operator,
        newSelectedGroups,
        field._id
      );

      if (response) {
        const newGroup: SegmentFilter = {
          fieldId: field._id,
          key: field.filterKey,
          name: field.filterLabel,
          values: values,
          conditions: conditions.length > 0 ? conditions : undefined,
          operator: conditions.length > 0 ? operator : undefined,
          count: response.count,
          invalidEmailCount: response.invalidEmailCount,
          unSubscribedUserCount: response.unSubscribedUserCount,
          segmentCount: response.segmentCount,
          segmentInvalidEmailCount: response.segmentInvalidEmailCount,
          segmentUnSubscribedUserCount: response.segmentUnSubscribedUserCount,
          type: field.filterType,
        };

        const updatedGroups = [...newSelectedGroups, newGroup];
        setSelectedGroups(updatedGroups);

        // Calculate total count
        const totalResponse = await getUserCount(null, [], null, null, updatedGroups);
        if (totalResponse) {
          setTotalCount(totalResponse.segmentCount || 0);
        }

        toast.success('Filter applied successfully');
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error('Failed to apply filter');
    } finally {
      setLoadingFieldCount((prev) => ({ ...prev, [field._id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Field Section */}
      <div className="flex items-center gap-2">
        <Select value={fieldToAdd} onValueChange={setFieldToAdd}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select a field to add" />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((field) => (
              <SelectItem key={field._id} value={field._id}>
                {field.filterLabel} ({field.filterType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleAddField} disabled={!fieldToAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>

      {/* Selected Fields */}
      {selectedFields.length > 0 && (
        <div className="space-y-4">
          {selectedFields.map((field) => (
            <div
              key={field._id}
              className="rounded-lg border p-4 space-y-4 bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{field.filterLabel}</h3>
                  <Badge variant="secondary">{field.filterType}</Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(field._id)}
                >
                  Remove
                </Button>
              </div>

              {field.filterType === 'INPUT' ? (
                <ConditionBuilder
                  field={field}
                  onApply={(conditions, operator) =>
                    handleApplyFilter(field, [], conditions, operator)
                  }
                  isLoading={loadingFieldCount[field._id] || false}
                  existingGroup={selectedGroups.find((g) => g.fieldId === field._id)}
                />
              ) : (
                <FilterValueSelector
                  field={field}
                  onApply={(values) => handleApplyFilter(field, values, [], 'AND')}
                  isLoading={loadingFieldCount[field._id] || false}
                  existingGroup={selectedGroups.find((g) => g.fieldId === field._id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No fields selected. Add a field to start building your segment.</p>
        </div>
      )}
    </div>
  );
}
