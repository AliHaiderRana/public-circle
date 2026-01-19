import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { createGroup, updateGroup, deleteGroup } from '@/actions/groups';
import { mutate } from 'swr';
import { Plus, Edit2, Trash2, Check, X, ChevronDown } from 'lucide-react';
import type { Group } from '@/types/segment';

interface GroupsFieldProps {
  groups?: Group[];
  selectedGroups: Group[];
  setSelectedGroups: (groups: Group[]) => void;
  multiple?: boolean;
  variant?: 'button' | 'dropdown';
  type?: 'campaign' | 'template';
  error?: boolean;
  errorText?: string;
  name?: string;
  setIsListOpen?: (open: boolean) => void;
}

export function GroupsField({
  groups = [],
  selectedGroups,
  setSelectedGroups,
  multiple = true,
  variant = 'button',
  type = 'campaign',
  error = false,
  errorText = '',
  name,
  setIsListOpen,
}: GroupsFieldProps) {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (error && fieldRef.current) {
      fieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  useEffect(() => {
    if (multiple && groups.length > 0 && selectedGroups.length === 0 && !didAutoSelect.current) {
      setSelectedGroups(groups);
      didAutoSelect.current = true;
    }
    if (groups.length === 0) {
      didAutoSelect.current = false;
    }
  }, [multiple, groups, selectedGroups.length, setSelectedGroups]);

  const filteredGroups = (groups || []).filter((group) =>
    group.groupName.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected =
    multiple &&
    filteredGroups.length > 0 &&
    filteredGroups.every((group) => selectedGroups.some((g) => g._id === group._id));

  const handleAllChange = () => {
    if (allSelected) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups);
    }
  };

  const handleCheckboxChange = (group: Group) => {
    if (multiple) {
      if (selectedGroups.some((g) => g._id === group._id)) {
        setSelectedGroups(selectedGroups.filter((g) => g._id !== group._id));
      } else {
        setSelectedGroups([...selectedGroups, group]);
      }
    } else {
      if (selectedGroups.some((g) => g._id === group._id)) {
        setSelectedGroups([]);
      } else {
        setSelectedGroups([group]);
      }
    }
  };

  const createNewGroup = async () => {
    if (!newGroupName.trim()) return;
    
    setIsCreating(true);
    const res = await createGroup({
      groupName: newGroupName,
      type: type === 'campaign' ? 'CAMPAIGN' : 'TEMPLATE',
    });

    if (res?.status === 200) {
      setIsCreating(false);
      setIsCreatingNew(false);
      setNewGroupName('');
      await mutate(
        type === 'campaign' ? '/company-grouping?type=CAMPAIGN' : '/company-grouping?type=TEMPLATE'
      );
    } else {
      setIsCreating(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditGroupId(group._id);
    setEditGroupName(group.groupName);
  };

  const handleEditCancel = () => {
    setEditGroupId(null);
    setEditGroupName('');
  };

  const handleEditUpdate = async () => {
    if (!editGroupName.trim() || !editGroupId) return;
    
    setIsEditing(true);
    const result = await updateGroup(editGroupId, {
      groupName: editGroupName,
      type: type === 'campaign' ? 'CAMPAIGN' : 'TEMPLATE',
    });
    
    if (result?.status === 200) {
      setIsEditing(false);
      setEditGroupId(null);
      setEditGroupName('');
      await mutate(
        type === 'campaign' ? '/company-grouping?type=CAMPAIGN' : '/company-grouping?type=TEMPLATE'
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = (group: Group) => {
    setDeleteGroupId(group._id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGroupId) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteGroup(deleteGroupId, type === 'campaign' ? 'CAMPAIGN' : 'TEMPLATE');
      if (res?.status === 200) {
        setIsDeleting(false);
        setDeleteGroupId(null);
        await mutate(
          type === 'campaign' ? '/company-grouping?type=CAMPAIGN' : '/company-grouping?type=TEMPLATE'
        );
      } else {
        setIsDeleting(false);
        setDeleteGroupId(null);
      }
    } catch (error) {
      setIsDeleting(false);
      setDeleteGroupId(null);
      console.error('Error deleting group:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteGroupId(null);
  };

  return (
    <div
      ref={fieldRef}
      className={cn(
        'relative inline-block',
        variant === 'dropdown' && 'w-full'
      )}
    >
      <Popover open={popoverOpen} onOpenChange={(open) => {
        setPopoverOpen(open);
        if (setIsListOpen) {
          setIsListOpen(open);
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between',
              variant === 'button' && 'w-auto',
              error && 'border-destructive'
            )}
          >
            {variant === 'button' && 'Groups'}
            {variant === 'dropdown' && !multiple && selectedGroups.length > 0 && (
              <span className="truncate mr-2">
                {selectedGroups[0].groupName}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search groups..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No groups found.</CommandEmpty>
              <CommandGroup>
                {!isCreatingNew ? (
                  <>
                    <CommandItem
                      onSelect={() => setIsCreatingNew(true)}
                      className="font-semibold"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Group
                    </CommandItem>
                    {multiple && filteredGroups.length > 0 && (
                      <CommandItem onSelect={handleAllChange}>
                        <div className="flex items-center space-x-2 w-full">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleAllChange}
                          />
                          <span>All</span>
                        </div>
                      </CommandItem>
                    )}
                    {filteredGroups.map((group) => (
                      <CommandItem
                        key={group._id}
                        onSelect={() => {
                          if (!multiple) {
                            setSelectedGroups([group]);
                            setPopoverOpen(false);
                            if (setIsListOpen) setIsListOpen(false);
                          }
                        }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {editGroupId === group._id ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <Input
                                value={editGroupName}
                                onChange={(e) => setEditGroupName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={isEditing}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditUpdate();
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCancel();
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {multiple && (
                                <Checkbox
                                  checked={selectedGroups.some((g) => g._id === group._id)}
                                  onCheckedChange={() => handleCheckboxChange(group)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                              <span className="truncate flex-1" title={group.groupName}>
                                {group.groupName}
                                {typeof group.contentCount === 'number' && (
                                  <span className="text-muted-foreground ml-1">
                                    ({group.contentCount})
                                  </span>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        {editGroupId !== group._id && (
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(group);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(group);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </CommandItem>
                    ))}
                  </>
                ) : (
                  <div className="p-2 space-y-2">
                    <Input
                      placeholder="Enter group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCreatingNew(false);
                          setNewGroupName('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={createNewGroup}
                        disabled={!newGroupName.trim() || isCreating}
                      >
                        {isCreating ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && errorText && (
        <p className="text-sm text-destructive mt-1">{errorText}</p>
      )}

      <Dialog open={!!deleteGroupId} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
