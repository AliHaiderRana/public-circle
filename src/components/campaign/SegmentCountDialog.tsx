import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getSegmentCounts } from '@/actions/campaign';

interface SegmentCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmentIds: string[];
}

interface SegmentCountResult {
  totalNumberOfContacts: number;
  totalInvalidEmailCount: number;
  totalUnSubscribedCount: number;
  segments: Array<{
    segmentId: string;
    segmentName: string;
    contactCount: number;
    invalidEmailCount: number;
    unSubscribedCount: number;
  }>;
}

export function SegmentCountDialog({
  open,
  onOpenChange,
  segmentIds,
}: SegmentCountDialogProps) {
  const [segmentCountResult, setSegmentCountResult] = useState<SegmentCountResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSegmentCounts = useCallback(async () => {
    if (segmentIds.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await getSegmentCounts(segmentIds);
      if (response?.status === 200 && response.data?.data) {
        setSegmentCountResult(response.data.data);
      } else {
        setSegmentCountResult(null);
      }
    } catch (error) {
      console.error('Error fetching segment counts:', error);
      setSegmentCountResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [segmentIds]);

  // Fetch counts when dialog opens
  useEffect(() => {
    if (open && segmentIds.length > 0) {
      fetchSegmentCounts();
    } else {
      setSegmentCountResult(null);
    }
  }, [open, fetchSegmentCounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audience Count</DialogTitle>
          <DialogDescription>
            Total contacts who will receive this campaign
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : segmentCountResult ? (
          <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segment Name</TableHead>
                    <TableHead className="text-center">Total Recipients</TableHead>
                    <TableHead className="text-center">Invalid Emails</TableHead>
                    <TableHead className="text-center">Unsubscribed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentCountResult.segments?.map((seg, index) => {
                    const isLastRow = index === segmentCountResult.segments.length - 1;
                    return (
                      <React.Fragment key={seg.segmentId}>
                        <TableRow>
                          <TableCell>{seg.segmentName}</TableCell>
                          <TableCell className="text-center">{seg.contactCount}</TableCell>
                          <TableCell className="text-center">{seg.invalidEmailCount}</TableCell>
                          <TableCell className="text-center">{seg.unSubscribedCount}</TableCell>
                        </TableRow>
                        {!isLastRow && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-2">
                              <Badge variant="outline">OR</Badge>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-center font-bold">
                      {segmentCountResult.totalNumberOfContacts}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {segmentCountResult.totalInvalidEmailCount}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {segmentCountResult.totalUnSubscribedCount}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
              <p className="font-medium mb-2">Note:</p>
              <p>
                The total count is not the sum of all contacts because a single contact can be part
                of multiple segments. These are unique emails.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            {segmentIds.length === 0
              ? 'Please select at least one segment'
              : 'No data available'}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
