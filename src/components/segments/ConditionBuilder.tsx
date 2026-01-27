import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { CONDITIONS, DURATION_UNITS } from '@/lib/segment-constants';
import type { Filter, SegmentFilter, FilterCondition, MatchType } from '@/types/segment';

interface ConditionBuilderProps {
  field: Filter;
  onApply: (conditions: FilterCondition[], operator: 'AND' | 'OR') => void;
  isLoading: boolean;
  existingGroup?: SegmentFilter;
}

export function ConditionBuilder({
  field,
  onApply,
  isLoading,
  existingGroup,
}: ConditionBuilderProps) {
  const [matchType, setMatchType] = useState<MatchType>('all');
  const [conditions, setConditions] = useState<FilterCondition[]>(
    existingGroup?.conditions || [
      {
        conditionType: '',
        value: '',
      },
    ]
  );

  useEffect(() => {
    if (existingGroup?.conditions) {
      setConditions(existingGroup.conditions);
      setMatchType(existingGroup.operator === 'OR' ? 'any' : 'all');
    }
  }, [existingGroup]);

  const availableConditions = CONDITIONS.filter((cond) => {
    if (Array.isArray(cond.dataType)) {
      return cond.dataType.includes(field.filterDataType);
    }
    return cond.dataType === field.filterDataType;
  });

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        conditionType: '',
        value: '',
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    } else {
      toast.error('At least one condition is required');
    }
  };

  const handleConditionChange = (index: number, updates: Partial<FilterCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
  };

  const handleApply = () => {
    const validConditions = conditions.filter((c) => c.conditionType);
    if (validConditions.length === 0) {
      toast.error('Please add at least one condition');
      return;
    }

    // Validate conditions
    for (const condition of validConditions) {
      if (['between', 'timestamp_between'].includes(condition.conditionType)) {
        if (!condition.fromValue || !condition.toValue) {
          toast.error('Please provide both from and to values for between conditions');
          return;
        }
      } else if (
        ['is_timestamp', 'is_not_timestamp'].includes(condition.conditionType)
      ) {
        // These don't need values
      } else if (
        [
          'more_than_in_past',
          'less_than_in_past',
          'less_than_in_future',
          'more_than_in_future',
        ].includes(condition.conditionType)
      ) {
        if (!condition.value || !condition.duration) {
          toast.error('Please provide value and duration for relative time conditions');
          return;
        }
      } else if (!condition.value) {
        toast.error('Please provide a value for the condition');
        return;
      }
    }

    const operator = matchType === 'all' ? 'AND' : 'OR';
    onApply(validConditions, operator);
  };

  const renderConditionInput = (condition: FilterCondition, index: number) => {
    const conditionDef = CONDITIONS.find((c) => c.value === condition.conditionType);

    if (!conditionDef) return null;

    // Timestamp conditions that don't need values
    if (['is_timestamp', 'is_not_timestamp'].includes(condition.conditionType)) {
      return null;
    }

    // Between conditions
    if (['between', 'timestamp_between'].includes(condition.conditionType)) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label>From</Label>
            <Input
              type={field.filterDataType === 'number' ? 'number' : 'date'}
              value={
                condition.fromValue instanceof Date
                  ? condition.fromValue.toISOString().split('T')[0]
                  : condition.fromValue || ''
              }
              onChange={(e) =>
                handleConditionChange(index, {
                  fromValue: field.filterDataType === 'number' ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              type={field.filterDataType === 'number' ? 'number' : 'date'}
              value={
                condition.toValue instanceof Date
                  ? condition.toValue.toISOString().split('T')[0]
                  : condition.toValue || ''
              }
              onChange={(e) =>
                handleConditionChange(index, {
                  toValue: field.filterDataType === 'number' ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </div>
        </div>
      );
    }

    // Relative time conditions
    if (
      [
        'more_than_in_past',
        'less_than_in_past',
        'less_than_in_future',
        'more_than_in_future',
      ].includes(condition.conditionType)
    ) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label>Value</Label>
            <Input
              type="number"
              value={condition.value || ''}
              onChange={(e) =>
                handleConditionChange(index, { value: Number(e.target.value) })
              }
              placeholder="Enter number"
            />
          </div>
          <div>
            <Label>Duration</Label>
            <Select
              value={condition.duration || 'day'}
              onValueChange={(value) => handleConditionChange(index, { duration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Regular value input
    return (
      <div>
        <Label>Value</Label>
        <Input
          type={field.filterDataType === 'number' ? 'number' : 'text'}
          value={condition.value || ''}
          onChange={(e) =>
            handleConditionChange(index, {
              value: field.filterDataType === 'number' ? Number(e.target.value) : e.target.value,
            })
          }
          placeholder="Enter value"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={matchType} onValueChange={(value: MatchType) => setMatchType(value)}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="any">Any</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          of the following conditions match ({field.filterKey})
        </span>
      </div>

      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={index} className="rounded-lg border p-4 space-y-3 bg-muted/50">
            {index > 0 && (
              <div className="flex items-center justify-center -mt-2 mb-2">
                <Badge variant="outline">{matchType === 'all' ? 'AND' : 'OR'}</Badge>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Condition Type</Label>
                <Select
                  value={condition.conditionType}
                  onValueChange={(value) =>
                    handleConditionChange(index, {
                      conditionType: value,
                      value: ['is_timestamp', 'is_not_timestamp'].includes(value) ? '-' : '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConditions.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {condition.conditionType && renderConditionInput(condition, index)}
            </div>
            <div className="flex items-center justify-end gap-2">
              {conditions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>
        <Button type="button" onClick={handleApply} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Applying...' : existingGroup ? 'Update' : 'Apply'}
        </Button>
      </div>
    </div>
  );
}
