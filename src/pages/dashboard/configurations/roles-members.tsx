import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { paths } from '@/routes/paths';
import { Plus, Trash2, RefreshCw, Mail } from 'lucide-react';
import {
  getAllRoles,
  getAllRolesUsers,
  createRole,
  deleteRoleUser,
  resendInvite,
} from '@/actions/roles';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ----------------------------------------------------------------------

const addUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required!' }),
  email: z.string().min(1, { message: 'Email is required!' }).email({ message: 'Invalid email address!' }),
  role: z.string().min(1, { message: 'Role is required!' }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function RolesAndMembersPage() {
  const { user } = useAuthContext();
  const { allRoles, isLoading: isLoadingRoles, mutate: mutateRoles } = getAllRoles();
  const { allRolesUsers, isLoading: isLoadingUsers, mutate: mutateUsers } = getAllRolesUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resendingUsers, setResendingUsers] = useState<Record<string, boolean>>({});

  const methods = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([mutateRoles(), mutateUsers()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const handleOpenAddDialog = () => {
    reset();
    setDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setDialogOpen(false);
    reset();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await createRole({
        name: data.name,
        emailAddress: data.email,
        roleId: data.role,
      });
      if (result) {
        reset();
        setDialogOpen(false);
        await mutateUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  });

  const handleOpenDeleteDialog = (member: any) => {
    setSelectedUser(member);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = async () => {
    if (selectedUser) {
      try {
        const result = await deleteRoleUser(selectedUser._id);
        if (result) {
          await mutateUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
    handleCloseDeleteDialog();
  };

  const handleOpenResendDialog = (member: any) => {
    setSelectedUser(member);
    setResendDialogOpen(true);
  };

  const handleCloseResendDialog = () => {
    setResendDialogOpen(false);
    setSelectedUser(null);
  };

  const handleResendInvite = async () => {
    if (selectedUser) {
      setResendingUsers((prev) => ({ ...prev, [selectedUser._id]: true }));
      try {
        const result = await resendInvite({
          emailAddress: selectedUser.emailAddress,
        });
        if (result) {
          setResendDialogOpen(false);
          setSelectedUser(null);
        }
      } catch (error) {
        console.error('Error resending invite:', error);
      } finally {
        setResendingUsers((prev) => ({ ...prev, [selectedUser._id]: false }));
      }
    }
  };

  const canDeleteUser = (member: any) => {
    if (member?.role?.name === 'Admin') return false;
    if (member?._id === user?._id) return false;
    if (member?.isEmailVerified && user?.role?.name !== 'Admin') return false;
    return true;
  };

  const getDeleteTooltip = (member: any) => {
    if (member?.role?.name === 'Admin') return 'You cannot delete an admin role';
    if (member?._id === user?._id) return 'You cannot delete yourself';
    if (member?.isEmailVerified && user?.role?.name !== 'Admin')
      return 'Only admin can delete verified users';
    return '';
  };

  const isLoading = isLoadingRoles || isLoadingUsers;
  const members = Array.isArray(allRolesUsers) ? allRolesUsers : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Members</h1>
          <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage roles and permissions for team members</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              title="No team members found"
              description="Add a member to get started"
              action={
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add new user
                </Button>
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Email</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => {
                    const canDelete = canDeleteUser(member);
                    const deleteTooltip = getDeleteTooltip(member);
                    const isResending = resendingUsers[member._id];

                    return (
                      <TableRow key={member._id}>
                        <TableCell className="font-medium">
                          {member.firstName || member.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">{member.emailAddress || member.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{member.role?.name || 'User'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={member.isEmailVerified ? 'default' : 'outline'}>
                            {member.isEmailVerified ? 'Active' : 'Invited'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!member.isEmailVerified && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isResending}
                                      onClick={() => handleOpenResendDialog(member)}
                                    >
                                      <Mail className="h-4 w-4 mr-2" />
                                      {isResending ? 'Sending...' : 'Resend'}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Resend invitation email</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={!canDelete}
                                      onClick={() => handleOpenDeleteDialog(member)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {deleteTooltip && (
                                  <TooltipContent>
                                    <p>{deleteTooltip}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new team member to your organization. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...methods.register('name')}
                placeholder="Enter full name"
              />
              {methods.formState.errors.name && (
                <p className="text-sm text-destructive">{methods.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...methods.register('email')}
                placeholder="Enter email address"
              />
              {methods.formState.errors.email && (
                <p className="text-sm text-destructive">{methods.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={methods.watch('role')}
                onValueChange={(value) => methods.setValue('role', value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role: any) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {methods.formState.errors.role && (
                <p className="text-sm text-destructive">{methods.formState.errors.role.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseAddDialog}>
                Cancel
              </Button>
              <LoadingButton type="submit" loading={isSubmitting}>
                Send Invitation
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.firstName || selectedUser?.name || 'this user'}{' '}
              from this role? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Invitation Dialog */}
      <AlertDialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resend the invitation email to{' '}
              {selectedUser?.emailAddress || selectedUser?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseResendDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResendInvite}
              disabled={resendingUsers[selectedUser?._id]}
            >
              {resendingUsers[selectedUser?._id] ? 'Sending...' : 'Resend Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
