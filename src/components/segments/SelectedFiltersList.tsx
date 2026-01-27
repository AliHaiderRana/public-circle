import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
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

  const getFieldValuesDisplay = (group: SegmentFilter): string => {
    if (group.conditions && group.conditions.length > 0) {
      return `(${group.conditions.length} condition${group.conditions.length > 1 ? 's' : ''})`;
    }
    const values = Array.isArray(group.values) ? group.values : [group.values];
    return `(${values.length} option${values.length !== 1 ? 's' : ''})`;
  };

  // Calculate totals
  const totals = selectedGroups.reduce(
    (acc, group) => ({
      count: acc.count + (group.count || 0),
      invalidEmailCount: acc.invalidEmailCount + (group.invalidEmailCount || 0),
      unSubscribedUserCount: acc.unSubscribedUserCount + (group.unSubscribedUserCount || 0),
    }),
    { count: 0, invalidEmailCount: 0, unSubscribedUserCount: 0 }
  );

  if (selectedGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No filters applied yet. Add and apply filters to build your segment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field Name</TableHead>
              <TableHead>Field Values</TableHead>
              <TableHead className="text-center">Total Who Will Be Receiving Email</TableHead>
              <TableHead className="text-center">Invalid Users</TableHead>
              <TableHead className="text-center">Unsubscribed Users</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedGroups.map((group) => (
              <TableRow key={group.fieldId}>
                <TableCell className="font-medium">{group.name || group.key}</TableCell>
                <TableCell className="text-muted-foreground">
                  {getFieldValuesDisplay(group)}
                </TableCell>
                <TableCell className="text-center">
                  {(group.count || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {(group.invalidEmailCount || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {(group.unSubscribedUserCount || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(group.fieldId)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-center font-semibold">
                {totals.count.toLocaleString()}
              </TableCell>
              <TableCell className="text-center font-semibold">
                {totals.invalidEmailCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center font-semibold">
                {totals.unSubscribedUserCount.toLocaleString()}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        This count is approximate as a user can be included in multiple fields, which may reduce the actual count.
      </p>
    </div>
  );
}
