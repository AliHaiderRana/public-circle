import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTemplate, duplicateTemplate, getPaginatedTemplates, getAllTemplateGroups, getTemplateById } from '@/actions/templates';
import { createGroup, updateGroup, deleteGroup } from '@/actions/groups';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw, 
  Copy, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileCode, 
  Monitor, 
  Smartphone, 
  Home,
  AlertTriangle,
  Check,
  X,
  Info
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { TemplatePreviewDrawer } from '@/components/template-editor/TemplatePreviewDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function TemplatesListPage() {
  const navigate = useNavigate();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<any>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Group management state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  
  const { allGroups: templateGroups, isLoading: groupsLoading } = getAllTemplateGroups();

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Initialize selected categories to all categories when groups load
  useEffect(() => {
    if (templateGroups && templateGroups.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories(templateGroups.map((group: any) => group._id));
    }
  }, [templateGroups]);

  // Fetch templates with search, category filter, and pagination
  useEffect(() => {
    fetchTemplates();
  }, [debouncedSearchTerm, selectedCategories, page, rowsPerPage]);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      let query = `?pageNumber=${page}&pageSize=${rowsPerPage}&kind=REGULAR`;
      if (selectedCategories.length > 0) {
        query += `&companyGroupingIds=${selectedCategories.join(',')}`;
      }
      if (debouncedSearchTerm) {
        query += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }
      const response = await getPaginatedTemplates(query);
      if (response?.data?.data) {
        setTemplates(response.data.data.templates || []);
        setTotalCount(response.data.data.totalRecords || 0);
      } else {
        setTemplates([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
      setTotalCount(0);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    setPage(1);
  };

  const handleSelectAllCategories = () => {
    if (templateGroups && templateGroups.length > 0) {
      if (selectedCategories.length === templateGroups.length) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories(templateGroups.map((group: any) => group._id));
      }
      setPage(1);
    }
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: string) => {
    setRowsPerPage(Number(newRowsPerPage));
    setPage(1);
  };

  const totalPages = Math.ceil((totalCount || 0) / rowsPerPage);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTemplates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteClick = (template: any) => {
    setTemplateToDelete(template);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      const result = await deleteTemplate(templateToDelete._id);
      if (result?.status === 200 || result?.data) {
        toast.success('Template deleted successfully');
        setOpenDeleteDialog(false);
        setTemplateToDelete(null);
        fetchTemplates();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDuplicateClick = (template: any) => {
    setTemplateToDuplicate(template);
    setOpenDuplicateDialog(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!templateToDuplicate) return;
    setIsDuplicating(true);
    try {
      const result = await duplicateTemplate(templateToDuplicate._id || templateToDuplicate.id);
      if (result?.data || result?.status === 200) {
        toast.success('Template duplicated successfully');
        setOpenDuplicateDialog(false);
        setTemplateToDuplicate(null);
        fetchTemplates();
      } else {
        toast.error('Failed to duplicate template');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handlePreviewClick = (template: any) => {
    setPreviewTemplateId(template._id || template.id);
    setPreviewOpen(true);
  };

  // Group management handlers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    setIsCreatingGroup(true);
    try {
      const result = await createGroup({ groupName: newGroupName.trim(), type: 'TEMPLATE' });
      if (result?.status === 200 || result?.data) {
        setNewGroupName('');
        setIsCreatingGroup(false);
        toast.success('Group created successfully');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleStartEditGroup = (group: any) => {
    setEditingGroupId(group._id);
    setEditingGroupName(group.groupName || group.name);
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    setIsUpdatingGroup(true);
    try {
      const result = await updateGroup(groupId, { groupName: editingGroupName.trim(), type: 'TEMPLATE' });
      if (result?.status === 200 || result?.data) {
        setEditingGroupId(null);
        setEditingGroupName('');
        toast.success('Group updated successfully');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleDeleteGroupClick = (groupId: string) => {
    setDeletingGroupId(groupId);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deletingGroupId) return;
    setIsDeletingGroup(true);
    try {
      const result = await deleteGroup(deletingGroupId, 'TEMPLATE');
      if (result?.status === 200 || result?.data) {
        setDeletingGroupId(null);
        toast.success('Group deleted successfully');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const toSentenceCase = (str: string) => {
    return str.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasUnsubscribeLink = (template: any) => {
    if (!template.body) return true;
    return /unsubscribe/i.test(template.body);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your email templates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button onClick={() => navigate(paths.dashboard.template.select)}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Filter Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Template Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create New Group */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCreatingGroup(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Group
              </Button>
              {isCreatingGroup && (
                <div className="space-y-2 p-2 border rounded-md">
                  <Input
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateGroup();
                      } else if (e.key === 'Escape') {
                        setIsCreatingGroup(false);
                        setNewGroupName('');
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateGroup}
                      disabled={isCreatingGroup || !newGroupName.trim()}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingGroup(false);
                        setNewGroupName('');
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Groups List */}
            {groupsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : templateGroups && templateGroups.length > 0 ? (
              <div className="space-y-2">
                {/* Select All */}
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={selectedCategories.length === templateGroups.length && templateGroups.length > 0}
                    onCheckedChange={handleSelectAllCategories}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-sm font-semibold cursor-pointer flex-1"
                  >
                    All Groups
                  </Label>
                </div>

                {/* Individual Groups */}
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {templateGroups.map((group: any) => (
                    <div
                      key={group._id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                    >
                      {editingGroupId === group._id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateGroup(group._id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditGroup();
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateGroup(group._id)}
                            disabled={isUpdatingGroup}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEditGroup}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Checkbox
                            id={`category-${group._id}`}
                            checked={selectedCategories.includes(group._id)}
                            onCheckedChange={() => handleCategoryChange(group._id)}
                          />
                          <Label
                            htmlFor={`category-${group._id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {group.groupName || group.name}
                            {typeof group.contentCount === 'number' && (
                              <span className="text-muted-foreground ml-1">
                                ({group.contentCount})
                              </span>
                            )}
                          </Label>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleStartEditGroup(group)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => handleDeleteGroupClick(group._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No groups available</p>
            )}
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Templates</CardTitle>
              <div className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'template' : 'templates'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {templatesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-20 w-20 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center p-12">
                <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {debouncedSearchTerm
                    ? 'No templates match your search. Try a different term.'
                    : 'No templates found. Create one to get started.'}
                </p>
                {!debouncedSearchTerm && (
                  <Button onClick={() => navigate(paths.dashboard.template.select)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Create Template
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template: any) => (
                  <div
                    key={template._id || template.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {template.thumbnailURL && !imageErrors.has(template._id || template.id) ? (
                        <img
                          src={template.thumbnailURL}
                          alt={template.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => {
                            setImageErrors((prev) => new Set(prev).add(template._id || template.id));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileCode className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* Preview Overlay */}
                      <div
                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => handlePreviewClick(template)}
                      >
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base leading-tight">{template.name}</h3>
                            {!hasUnsubscribeLink(template) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This template does not have an unsubscribe link</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {template.companyGrouping && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Group:</span>
                            <span>{template.companyGrouping.groupName || template.companyGrouping.name}</span>
                          </div>
                        )}
                        {template.templateSource && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Source:</span>
                            <Badge variant="outline" className="text-xs">
                              {toSentenceCase(template.templateSource)}
                            </Badge>
                          </div>
                        )}
                        {template.updatedAt && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Updated:</span>
                            <span>{format(new Date(template.updatedAt), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        {template.updatedBy && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">By:</span>
                            <span>
                              {template.updatedBy.firstName} {template.updatedBy.lastName}
                            </span>
                          </div>
                        )}
                        {template.campaigns && template.campaigns.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Campaigns:</span>
                            <span>{template.campaigns.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`${paths.dashboard.template.create}/${template._id || template.id}`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewClick(template)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateClick(template)}
                          disabled={isDuplicating}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(template)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!templatesLoading && totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center sm:justify-start text-sm text-muted-foreground">
                  <span>
                    Page {page} of {totalPages} • {totalCount} total templates
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <Select value={rowsPerPage.toString()} onValueChange={handleChangeRowsPerPage}>
                      <SelectTrigger className="w-full sm:w-[80px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(Math.max(1, page - 1))}
                    disabled={page === 1 || templatesLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages || templatesLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Template Dialog */}
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

      {/* Duplicate Template Dialog */}
      <Dialog open={openDuplicateDialog} onOpenChange={setOpenDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogDescription>
              Create a copy of the template <strong>{templateToDuplicate?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDuplicateDialog(false)}
              disabled={isDuplicating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDuplicate}
              disabled={isDuplicating}
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duplicating...
                </>
              ) : (
                'Duplicate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={!!deletingGroupId} onOpenChange={() => setDeletingGroupId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGroupId(null)} disabled={isDeletingGroup}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteGroup} disabled={isDeletingGroup}>
              {isDeletingGroup ? (
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

      {/* Preview Drawer */}
      <TemplatePreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        templateId={previewTemplateId || undefined}
      />
    </div>
  );
}
