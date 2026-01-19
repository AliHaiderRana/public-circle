import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Eye, EyeOff, Settings2 } from 'lucide-react';
import { formatKeyName } from './utils';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------

interface TableCustomizationProps {
  availableKeys: string[];
  visibleKeys: string[];
  onVisibleKeysChange: (keys: string[]) => void;
}

export function TableCustomization({
  availableKeys,
  visibleKeys,
  onVisibleKeysChange,
}: TableCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localVisibleKeys, setLocalVisibleKeys] = useState<string[]>(visibleKeys);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => {
    setLocalVisibleKeys(visibleKeys);
  }, [visibleKeys]);

  const handleToggleKey = (key: string) => {
    const newVisibleKeys = localVisibleKeys.includes(key)
      ? localVisibleKeys.filter((k) => k !== key)
      : [...localVisibleKeys, key];
    setLocalVisibleKeys(newVisibleKeys);
  };

  const handleSelectAll = () => {
    if (localVisibleKeys.length === availableKeys.length) {
      setLocalVisibleKeys([]);
    } else {
      setLocalVisibleKeys([...availableKeys]);
    }
  };

  const handleApply = () => {
    onVisibleKeysChange(localVisibleKeys);
  };

  const handleReset = () => {
    // Reset to first 5 keys
    const defaultKeys = availableKeys.slice(0, 5);
    setLocalVisibleKeys(defaultKeys);
    onVisibleKeysChange(defaultKeys);
  };

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragEnter = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (draggedKey && draggedKey !== targetKey) {
      setDragOverKey(targetKey);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedKey || draggedKey === targetKey) {
      setDragOverKey(null);
      return;
    }

    const draggedIndex = localVisibleKeys.indexOf(draggedKey);
    const targetIndex = localVisibleKeys.indexOf(targetKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Only update if we're actually moving to a different position
    if (draggedIndex !== targetIndex) {
      const newKeys = [...localVisibleKeys];
      newKeys.splice(draggedIndex, 1);
      newKeys.splice(targetIndex, 0, draggedKey);
      setLocalVisibleKeys(newKeys);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the container, not just moving to a child
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverKey(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const visibleKeysSet = new Set(localVisibleKeys);
  const allSelected = availableKeys.length > 0 && localVisibleKeys.length === availableKeys.length;
  const someSelected = localVisibleKeys.length > 0 && localVisibleKeys.length < availableKeys.length;

  return (
    <Card>
      <Accordion type="single" collapsible value={isOpen ? 'customization' : undefined}>
        <AccordionItem value="customization" className="border-0">
          <AccordionTrigger
            onClick={() => setIsOpen(!isOpen)}
            className="hover:no-underline px-6 py-4"
          >
            <CardHeader className="p-0">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  <CardTitle className="text-lg">Table Customization</CardTitle>
                  {localVisibleKeys.length !== visibleKeys.length && (
                    <Badge variant="secondary" className="ml-2">
                      {localVisibleKeys.length} visible
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = someSelected;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm font-medium">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset to Default
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Visible Columns (Drag to reorder)</Label>
                <div
                  className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2"
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {localVisibleKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No columns visible. Select columns below to add them.
                    </p>
                  ) : (
                    localVisibleKeys.map((key, index) => (
                      <div
                        key={key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, key)}
                        onDragEnter={(e) => handleDragEnter(e, key)}
                        onDragOver={(e) => handleDragOver(e, key)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md transition-all',
                          draggedKey === key
                            ? 'opacity-50 cursor-grabbing bg-muted scale-95'
                            : 'cursor-move hover:bg-muted',
                          dragOverKey === key && draggedKey !== key && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleToggleKey(key)}
                          id={`key-${key}`}
                          className="flex-shrink-0"
                        />
                        <Label
                          htmlFor={`key-${key}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {formatKeyName(key)}
                        </Label>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {index + 1}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Hidden Columns</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {availableKeys
                    .filter((key) => !visibleKeysSet.has(key))
                    .map((key) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleToggleKey(key)}
                          id={`key-${key}`}
                        />
                        <Label
                          htmlFor={`key-${key}`}
                          className="flex-1 cursor-pointer text-sm font-normal text-muted-foreground"
                        >
                          {formatKeyName(key)}
                        </Label>
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  {availableKeys.filter((key) => !visibleKeysSet.has(key)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All columns are visible
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setLocalVisibleKeys(visibleKeys)}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>Apply Changes</Button>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
