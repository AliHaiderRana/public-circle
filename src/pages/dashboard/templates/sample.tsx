import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RefreshCw, Eye, Copy, Search, ArrowLeft, Loader2, Image as ImageIcon, Monitor, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllSampleTemplates, getAllCategories, getTemplateById } from '@/actions/templates';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';
import { paths } from '@/routes/paths';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { convertHtmlToJson } from '@/lib/html-to-json';
import { getFilterKeys } from '@/actions/filters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';
import { getAllUsers } from '@/actions/users';
import { cn } from '@/lib/utils';

export default function SampleTemplatesPage() {
  const navigate = useNavigate();
  const { allSampleTemplates, isLoading } = getAllSampleTemplates();
  const { allCategories, isLoading: categoriesLoading } = getAllCategories();
  const { mergedTags } = getFilterKeys();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch users for preview
  const { allUsers, isLoading: usersLoading } = getAllUsers(1, 100);
  const { filterKeysData } = getFilterKeys();

  const users = useMemo(() => {
    return Array.isArray(allUsers) ? allUsers : [];
  }, [allUsers]);

  const filterKeys = useMemo(() => {
    return filterKeysData?.data || [];
  }, [filterKeysData]);

  // Auto-select first user when users are loaded
  useEffect(() => {
    if (users.length > 0 && !selectedUser && previewOpen) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser, previewOpen]);

  // Fetch template HTML when preview opens
  useEffect(() => {
    if (previewOpen && previewTemplateId) {
      setPreviewLoading(true);
      getTemplateById(previewTemplateId)
        .then((response) => {
          const template = response?.data?.data || response?.data;
          if (template) {
            const html = template.body || template.html || template.content || '';
            setPreviewHtml(html);
          } else {
            setPreviewHtml('');
          }
        })
        .catch((error) => {
          console.error('Error fetching template:', error);
          setPreviewHtml('');
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    } else {
      setPreviewHtml('');
    }
  }, [previewOpen, previewTemplateId]);

  // Process template with user data
  const processTemplateWithUserData = (html: string): string => {
    if (!html || !selectedUser || !filterKeys?.length) return html;

    const userFields: Record<string, string> = {};
    filterKeys.forEach((key: string) => {
      userFields[key] = selectedUser[key] || '';
    });

    return Object.keys(userFields).reduce((processedHtml, key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      return processedHtml.replace(regex, userFields[key]);
    }, html);
  };

  const processedPreviewHtml = useMemo(() => {
    return processTemplateWithUserData(previewHtml);
  }, [previewHtml, selectedUser, filterKeys]);

  const getUserDisplayLabel = (user: any): string => {
    const firstName = user.firstName || user.first_name || user['First Name'] || '';
    const lastName = user.lastName || user.last_name || user['Last Name'] || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (user.email) {
      return user.email;
    } else if (user._id) {
      return user._id;
    }
    return 'Unknown User';
  };

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Filter templates based on selected categories and search term
  const filteredTemplates = allSampleTemplates?.filter((template: any) => {
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.some((categoryId) => 
        template.category?.includes(categoryId) || 
        template.categories?.some((cat: any) => cat._id === categoryId || cat === categoryId)
      );
    const matchesSearch = template.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    return matchesCategories && matchesSearch;
  }) || [];

  const handleRefresh = () => {
    setIsRefreshing(true);
    mutate(endpoints.templates.allSampleTemplates).finally(() => setIsRefreshing(false));
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleUseTemplate = async (templateId: string) => {
    setLoadingTemplateId(templateId);
    try {
      const res = await getTemplateById(templateId);
      if (res?.data?.data) {
        const template = res.data.data;
        const json = convertHtmlToJson(template.body);
        setLoadingTemplateId(null);
        navigate(paths.dashboard.template.create, {
          state: {
            importedTemplate: json,
            source: 'SAMPLE_TEMPLATE',
            filterKeysData: mergedTags,
          },
        });
      }
    } catch (error) {
      setLoadingTemplateId(null);
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    }
  };

  const handlePreviewClick = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setPreviewOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sample Templates</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Browse and use pre-designed email templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => navigate(paths.dashboard.template.root)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : allCategories && allCategories.length > 0 ? (
              <div className="space-y-4">
                {allCategories.map((category: any) => (
                  <div key={category._id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`category-${category._id}`}
                      checked={selectedCategories.includes(category._id)}
                      onCheckedChange={() => handleCategoryChange(category._id)}
                    />
                    <Label
                      htmlFor={`category-${category._id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {category.name}
                      {typeof category.templateCount === 'number' && (
                        <span className="text-muted-foreground ml-1">
                          ({category.templateCount})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categories available</p>
            )}
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategories.length > 0
                    ? 'No templates match your filters. Try adjusting your search or categories.'
                    : 'No sample templates found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: any) => (
                <Card
                  key={template._id}
                  className="group relative overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleUseTemplate(template._id)}
                >
                  {loadingTemplateId === template._id && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    {template.thumbnailURL && !imageErrors.has(template._id) ? (
                      <img
                        src={template.thumbnailURL}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(template._id));
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Preview Overlay */}
                    <div
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewClick(template._id);
                      }}
                    >
                      <div className="text-white text-center">
                        <Eye className="h-8 w-8 mx-auto mb-2" />
                        <span className="text-sm font-medium">Preview</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-1 line-clamp-2">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mb-4">
                      {template.description || 'No description'}
                    </CardDescription>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template._id);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewClick(template._id);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle>Template Preview</DialogTitle>
                <DialogDescription>
                  Preview how your template will look to recipients
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* Sample User Selection */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-user" className="text-sm whitespace-nowrap">
                    Sample user:
                  </Label>
                  <Select
                    value={selectedUser?._id || ''}
                    onValueChange={(value) => {
                      const user = users.find((u: any) => u._id === value);
                      setSelectedUser(user || null);
                    }}
                    disabled={usersLoading || users.length === 0}
                  >
                    <SelectTrigger id="sample-user" className="w-[180px]">
                      <SelectValue placeholder="Select user">
                        {usersLoading ? 'Loading...' : selectedUser ? getUserDisplayLabel(selectedUser) : 'Select user'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {usersLoading ? (
                        <SelectItem value="__loading__" disabled>
                          Loading users...
                        </SelectItem>
                      ) : users.length === 0 ? (
                        <SelectItem value="__no_users__" disabled>
                          No users found
                        </SelectItem>
                      ) : (
                        users.map((user: any) => (
                          <SelectItem key={user._id} value={user._id}>
                            {getUserDisplayLabel(user)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Device Toggle */}
                <Tabs value={previewDevice} onValueChange={(v) => setPreviewDevice(v as 'desktop' | 'mobile')}>
                  <TabsList>
                    <TabsTrigger value="desktop" className="gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="hidden sm:inline">Desktop</span>
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="hidden sm:inline">Mobile</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-muted p-6">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !previewHtml ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">No template content</p>
                  <p className="text-sm">The template could not be loaded</p>
                </div>
              </div>
            ) : (
              <>
                <style>{`
                  .preview-mobile, .preview-mobile * {
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                  }
                  .preview-mobile table {
                    width: 100% !important;
                    table-layout: fixed !important;
                  }
                  .preview-mobile img {
                    max-width: 100% !important;
                    height: auto !important;
                    display: block !important;
                  }
                  .preview-mobile td {
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                  }
                  .preview-mobile .footer-flex-responsive {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                    gap: 8px !important;
                    padding: 12px 10px !important;
                  }
                `}</style>
                <div className="flex justify-center">
                  {previewDevice === 'mobile' ? (
                    <div
                      className="bg-white shadow-lg preview-mobile border border-gray-300 rounded-lg overflow-hidden"
                      style={{
                        width: '375px',
                        minWidth: '375px',
                        maxWidth: '375px',
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(processedPreviewHtml, {
                            WHOLE_DOCUMENT: true,
                            ADD_TAGS: ['style'],
                            ADD_ATTR: ['style'],
                          }),
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white shadow-lg w-full max-w-4xl">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(processedPreviewHtml, {
                            WHOLE_DOCUMENT: true,
                            ADD_TAGS: ['style'],
                            ADD_ATTR: ['style'],
                          }),
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
