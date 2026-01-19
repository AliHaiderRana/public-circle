/**
 * SelectedSegmentsDisplay Component
 * Displays selected segments in a detailed table with segment keys, filter values, user counts, and remove actions
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X, Info, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SegmentFilter {
  _id?: string;
  key: string;
  value?: string | string[];
  values?: string[];
}

interface Segment {
  _id: string;
  name: string;
  filters?: SegmentFilter[];
  usersCount?: number;
  contactCount?: number;
}

interface SelectedSegmentsDisplayProps {
  segments: Segment[];
  onRemoveSegment: (segmentId: string) => void;
  showTotalCount?: boolean;
}

interface SegmentRow {
  segmentId: string;
  segmentName: string;
  filterKey: string;
  filterValue: string | string[];
  userCount: number;
}

export function SelectedSegmentsDisplay({
  segments,
  onRemoveSegment,
  showTotalCount = true,
}: SelectedSegmentsDisplayProps) {
  // Flatten segments into rows (one row per filter)
  const segmentRows = useMemo(() => {
    const rows: SegmentRow[] = [];

    segments.forEach((segment) => {
      const userCount = segment.usersCount || segment.contactCount || 0;

      if (segment.filters && segment.filters.length > 0) {
        segment.filters.forEach((filter) => {
          rows.push({
            segmentId: segment._id,
            segmentName: segment.name,
            filterKey: filter.key || 'N/A',
            filterValue: filter.values || filter.value || 'N/A',
            userCount,
          });
        });
      } else {
        // If no filters, show segment name as the key
        rows.push({
          segmentId: segment._id,
          segmentName: segment.name,
          filterKey: 'Segment',
          filterValue: segment.name,
          userCount,
        });
      }
    });

    return rows;
  }, [segments]);

  // Calculate total users (approximate)
  const totalUsers = useMemo(() => {
    const uniqueSegmentIds = new Set(segments.map((s) => s._id));
    return Array.from(uniqueSegmentIds).reduce((total, segmentId) => {
      const segment = segments.find((s) => s._id === segmentId);
      return total + (segment?.usersCount || segment?.contactCount || 0);
    }, 0);
  }, [segments]);

  const formatFilterValue = (value: string | string[]): React.ReactNode => {
    if (Array.isArray(value)) {
      if (value.length === 0) return 'No values';
      if (value.length === 1) return value[0];
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted">
                ({value.length} options)
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                {value.map((val, index) => (
                  <div key={index}>{val}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return value || 'N/A';
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Segments</CardTitle>
        <CardDescription>Detailed view of selected segments and their filters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment Key</TableHead>
                <TableHead>Segment Value</TableHead>
                <TableHead className="text-center">Selected Users</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segmentRows.map((row, index) => {
                // Group rows by segment for better visual organization
                const isFirstInSegment =
                  index === 0 || segmentRows[index - 1].segmentId !== row.segmentId;

                return (
                  <TableRow key={`${row.segmentId}-${row.filterKey}-${index}`}>
                    <TableCell className={cn(isFirstInSegment && 'font-medium')}>
                      {isFirstInSegment ? row.segmentName : ''}
                      {!isFirstInSegment && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({row.filterKey})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isFirstInSegment ? (
                        <Badge variant="outline">{row.filterKey}</Badge>
                      ) : null}
                      <span className={cn(!isFirstInSegment && 'ml-2')}>
                        {formatFilterValue(row.filterValue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isFirstInSegment ? (
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{row.userCount.toLocaleString()}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isFirstInSegment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveSegment(row.segmentId)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {showTotalCount && segmentRows.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="font-semibold">
                    Total Users:
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{totalUsers.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {showTotalCount && totalUsers > 0 && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-muted/30 rounded-md border">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Approximate Count</p>
              <p>
                This campaign will be sent to approximately{' '}
                <strong>{totalUsers.toLocaleString()}</strong> users. This count is approximate as
                a user can be included in multiple segments, which may reduce the actual count.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}