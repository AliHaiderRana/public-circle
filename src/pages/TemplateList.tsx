import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTemplates, deleteTemplate, duplicateTemplate, getPaginatedTemplates, getAllTemplateGroups, getTemplateById } from '@/actions/templates';
import { endpoints } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Plus, Trash2, Edit, RefreshCw, Copy, Search, ChevronLeft, ChevronRight, Eye, FileCode, Monitor, Smartphone, Home } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function TemplateList() {
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
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  const { allGroups: templateGroups, isLoading: groupsLoading } = getAllTemplateGroups();

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset page on new search
    }, 500); // 500ms debounce delay

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
    setPage(1); // Reset page when category filter changes
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: string) => {
    setRowsPerPage(Number(newRowsPerPage));
    setPage(1); // Reset to first page when rows per page changes
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
      await deleteTemplate(templateToDelete._id);
      toast.success('Template deleted successfully');
      setOpenDeleteDialog(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      console.error(error);
      // Toast handled in action
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
      // Toast handled in action
    } finally {
      setIsDuplicating(false);
    }
  };

  const handlePreviewClick = async (template: any) => {
    try {
      const res = await getTemplateById(template._id || template.id);
      if (res?.data?.data) {
        setPreviewTemplate(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load template preview');
    }
  };

  const cleanHtmlForMobile = (html: string) => {
    html = html.replace(/(width|max-width|height|max-height)="[^"]*"/gi, '');
    html = html.replace(/(width|max-width|height|max-height)\s*:\s*[^;]+;?/gi, '');
    return html;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href={paths.dashboard.root} onClick={(e) => { e.preventDefault(); navigate(paths.dashboard.root); }}>
                <Home className="h-4 w-4" />
              </a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Templates</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Templates</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your data templates here.</p>
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
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : templateGroups && templateGroups.length > 0 ? (
              <div className="space-y-2">
                {templateGroups.map((group: any) => (
                  <div key={group._id} className="flex items-center space-x-2">
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
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categories available</p>
            )}
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>All Templates</CardTitle>
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
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-16 w-16 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                 </div>
            ) : templates?.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                    {debouncedSearchTerm 
                      ? 'No templates match your search. Try a different term.'
                      : 'No templates found. Create one to get started.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {templates.map((template: any) => (
                        <Card 
                            key={template._id || template.id}
                            className="group relative overflow-hidden hover:shadow-lg transition-all border border-border/50"
                        >
                            {/* Thumbnail */}
                            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                                {template.thumbnailURL && !imageErrors.has(template._id || template.id) ? (
                                    <img
                                        src={template.thumbnailURL}
                                        alt={template.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                        onError={() => {
                                          // Handle CORS or image load errors gracefully
                                          setImageErrors((prev) => new Set(prev).add(template._id || template.id));
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <FileCode className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                                {/* Preview Overlay */}
                                <div
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewClick(template);
                                    }}
                                >
                                    <div className="text-white text-center">
                                        <Eye className="h-8 w-8 mx-auto mb-2" />
                                        <span className="text-sm font-medium">Preview</span>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                {/* Title Section */}
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-base leading-tight line-clamp-2">{template.name}</h3>
                                    {template.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                                    )}
                                </div>

                                {/* Metadata Section */}
                                <div className="space-y-2.5 pt-2 border-t">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div className="space-y-0.5">
                                            <span className="text-muted-foreground font-medium">Type</span>
                                            <p className="text-foreground">{template.kind || 'REGULAR'}</p>
                                        </div>
                                        {template.templateSource && (
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground font-medium">Source</span>
                                                <p className="text-foreground capitalize">{template.templateSource.toLowerCase().replace('_', ' ')}</p>
                                            </div>
                                        )}
                                        {template.companyGrouping && (
                                            <div className="space-y-0.5 col-span-2">
                                                <span className="text-muted-foreground font-medium">Group</span>
                                                <p className="text-foreground">{template.companyGrouping.groupName || template.companyGrouping.name}</p>
                                            </div>
                                        )}
                                        <div className="space-y-0.5">
                                            <span className="text-muted-foreground font-medium">Created</span>
                                            <p className="text-foreground">{template.createdAt ? format(new Date(template.createdAt), 'MMM dd, yyyy') : '-'}</p>
                                        </div>
                                        {template.updatedAt && (
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground font-medium">Updated</span>
                                                <p className="text-foreground">{format(new Date(template.updatedAt), 'MMM dd, yyyy')}</p>
                                            </div>
                                        )}
                                        {template.updatedBy && (
                                            <div className="space-y-0.5 col-span-2">
                                                <span className="text-muted-foreground font-medium">Updated by</span>
                                                <p className="text-foreground">{template.updatedBy.firstName} {template.updatedBy.lastName}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`${paths.dashboard.template.create}/${template._id || template.id}`);
                                        }}
                                        className="flex-1"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                const res = await getTemplateById(template._id || template.id);
                                                if (res?.data?.data) {
                                                    const templateData = res.data.data;
                                                    const { convertHtmlToJson } = await import('@/lib/html-to-json');
                                                    const json = convertHtmlToJson(templateData.body);
                                                    navigate(paths.dashboard.template.create, {
                                                        state: {
                                                            importedTemplate: json,
                                                            source: 'EXISTING_TEMPLATE',
                                                        },
                                                    });
                                                }
                                            } catch (error) {
                                                toast.error('Failed to import template');
                                            }
                                        }}
                                        title="Import as new template"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateClick(template);
                                        }}
                                        disabled={isDuplicating}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-destructive" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(template);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!templatesLoading && totalCount > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} • {totalCount || 0} total templates
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={rowsPerPage.toString()} onValueChange={handleChangeRowsPerPage}>
                      <SelectTrigger className="w-[80px]">
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

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Template Preview</DialogTitle>
                  <DialogDescription>
                    Preview how your template will look to recipients
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    Desktop
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Mobile
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <div
                className={cn(
                  'mx-auto bg-white shadow-lg',
                  previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
                )}
                style={{
                  transform: previewDevice === 'mobile' ? 'scale(0.8)' : 'scale(1)',
                  transformOrigin: 'top center',
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      previewDevice === 'mobile'
                        ? cleanHtmlForMobile(previewTemplate.body)
                        : previewTemplate.body,
                      {
                        WHOLE_DOCUMENT: true,
                        ADD_TAGS: ['style'],
                        ADD_ATTR: ['style'],
                      }
                    ),
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
