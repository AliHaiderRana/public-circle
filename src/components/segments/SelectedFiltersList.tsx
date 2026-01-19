import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SegmentFilter } from '@/types/segment';
import { getUserCount } from '@/actions/segments';

interface SelectedFiltersListProps {
  selectedGroups: SegmentFilter[];
  setSelectedGroups: (groups: SegmentFilter[]) => void;
  setTotalCount: (count: number) => void;
}

export function SelectedFiltersList({
  selectedGroups,
  setSelectedGroups,
  setTotalCount,
}: SelectedFiltersListProps) {
  const handleRemove = async (fieldId: string) => {
    const updated = selectedGroups.filter((g) => g.fieldId !== fieldId);
    setSelectedGroups(updated);

    // Recalculate total count
    if (updated.length > 0) {
      try {
        const response = await getUserCount(null, [], null, null, updated);
        if (response) {
          setTotalCount(response.segmentCount || 0);
        }
      } catch (error) {
        console.error('Error recalculating count:', error);
      }
    } else {
      setTotalCount(0);
    }
  };

  const formatFilterDisplay = (group: SegmentFilter) => {
    if (group.conditions && group.conditions.length > 0) {
      return group.conditions
        .map((cond) => {
          if (['between', 'timestamp_between'].includes(cond.conditionType)) {
            return `${cond.conditionType} ${cond.fromValue} - ${cond.toValue}`;
          }
          if (cond.duration) {
            return `${cond.conditionType} ${cond.value} ${cond.duration}`;
          }
          return `${cond.conditionType} ${cond.value}`;
        })
        .join(` ${group.operator || 'AND'} `);
    }
    return Array.isArray(group.values) ? group.values.join(', ') : String(group.values);
  };

  if (selectedGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No filters applied yet. Add and apply filters to build your segment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selectedGroups.map((group) => (
        <Card key={group.fieldId}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{group.name || group.key}</h4>
                  <Badge variant="secondary">{group.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatFilterDisplay(group)}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Count: {group.count || 0}</span>
                  {group.invalidEmailCount !== undefined && (
                    <span>Invalid: {group.invalidEmailCount}</span>
                  )}
                  {group.unSubscribedUserCount !== undefined && (
                    <span>Unsubscribed: {group.unSubscribedUserCount}</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(group.fieldId)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
