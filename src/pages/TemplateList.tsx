import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTemplates, deleteTemplate } from '@/actions/templates';
import { endpoints } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TemplateList() {
  const navigate = useNavigate();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  
  const { tempTemplates, revalidateTemplates } = getAllTemplates();
  const templates = Array.isArray(tempTemplates) ? tempTemplates : [];
  const templatesLoading = !tempTemplates;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    revalidateTemplates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteClick = (template: any) => {
    setTemplateToDelete(template);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate(templateToDelete._id);
      toast.success('Template deleted successfully');
      setOpenDeleteDialog(false);
      setTemplateToDelete(null);
      revalidateTemplates();
    } catch (error) {
      console.error(error);
      // Toast handled in action
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">Manage your data templates here.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
            >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button onClick={() => navigate('/templates/create')}>
                <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
        </CardHeader>
        <CardContent>
            {templatesLoading ? (
                 <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
            ) : templates?.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                    No templates found. Create one to get started.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {templates.map((template: any) => (
                        <TableRow key={template._id || template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.kind}</TableCell>
                        <TableCell>
                            {template.createdAt ? format(new Date(template.createdAt), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => navigate(`/dashboard/templates/template/${template._id || template.id}`)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(template)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template <strong>{templateToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
