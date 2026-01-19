import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface TableCustomizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleKeys: string[];
  setVisibleKeys: (keys: string[]) => void;
  contacts: any[];
}

export function TableCustomization({
  open,
  onOpenChange,
  visibleKeys,
  setVisibleKeys,
  contacts,
}: TableCustomizationProps) {
  const allKeys = contacts.length > 0 ? Object.keys(contacts[0]).filter((k) => k !== '__v') : [];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleToggleKey = (key: string, checked: boolean) => {
    if (checked) {
      setVisibleKeys([...visibleKeys, key]);
    } else {
      setVisibleKeys(visibleKeys.filter((k) => k !== key));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newKeys = [...visibleKeys];
    const draggedKey = newKeys[draggedIndex];
    newKeys.splice(draggedIndex, 1);
    newKeys.splice(index, 0, draggedKey);
    setVisibleKeys(newKeys);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Table Columns</DialogTitle>
          <DialogDescription>
            Select which columns to display in the contacts table
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Visible Columns (Drag to reorder)</Label>
                <div className="space-y-2 border rounded-lg p-2 min-h-[200px]">
                  {visibleKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No columns visible. Select columns below to add them.
                    </p>
                  ) : (
                    visibleKeys.map((key, index) => (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center space-x-2 p-2 rounded border bg-background cursor-move hover:bg-muted"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Checkbox
                          id={`visible-${key}`}
                          checked={true}
                          onCheckedChange={() => handleToggleKey(key, false)}
                        />
                        <Label htmlFor={`visible-${key}`} className="cursor-pointer capitalize flex-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Columns</Label>
                <div className="space-y-2 border rounded-lg p-2 max-h-[200px] overflow-y-auto">
                  {allKeys
                    .filter((key) => !visibleKeys.includes(key))
                    .map((key) => (
                      <div key={key} className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                        <Checkbox
                          id={`available-${key}`}
                          checked={false}
                          onCheckedChange={() => handleToggleKey(key, true)}
                        />
                        <Label htmlFor={`available-${key}`} className="cursor-pointer capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    ))}
                  {allKeys.filter((key) => !visibleKeys.includes(key)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      All columns are visible
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
