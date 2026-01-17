import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGroup, updateGroup, deleteGroup, getAllTemplateGroups } from '@/actions/groups';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface GroupManagerProps {
  type?: 'TEMPLATE' | 'CAMPAIGN';
  onGroupSelect?: (groupId: string) => void;
  selectedGroups?: string[];
}

export default function GroupManager({ type = 'TEMPLATE', onGroupSelect, selectedGroups = [] }: GroupManagerProps) {
  const { allGroups, isLoading } = getAllTemplateGroups();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deletingGroup, setDeletingGroup] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    setIsCreating(true);
    const result = await createGroup({ groupName: groupName.trim(), type });
    if (result) {
      setIsCreateDialogOpen(false);
      setGroupName('');
    }
    setIsCreating(false);
  };

  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setGroupName(group.groupName || group.name || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!groupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    if (!editingGroup) return;

    setIsUpdating(true);
    const result = await updateGroup(editingGroup._id, {
      groupName: groupName.trim(),
      type,
    });
    if (result) {
      setIsEditDialogOpen(false);
      setEditingGroup(null);
      setGroupName('');
    }
    setIsUpdating(false);
  };

  const handleDeleteClick = (group: any) => {
    setDeletingGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;

    setIsDeleting(true);
    const result = await deleteGroup(deletingGroup._id, type);
    if (result) {
      setIsDeleteDialogOpen(false);
      setDeletingGroup(null);
    }
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Groups</h3>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {allGroups && allGroups.length > 0 ? (
        <div className="space-y-2">
          {allGroups.map((group: any) => (
            <div
              key={group._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="flex-1">{group.groupName || group.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(group)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(group)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No groups found</p>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Enter a name for the new group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !groupName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update the group name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingGroup(null);
                setGroupName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !groupName.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the group <strong>{deletingGroup?.groupName || deletingGroup?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
