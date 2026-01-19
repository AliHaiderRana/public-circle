import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Eye, Copy, Search, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllSampleTemplates, getAllCategories, getTemplateById } from '@/actions/templates';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';
import { paths } from '@/routes/paths';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { convertHtmlToJson } from '@/lib/html-to-json';
import { getFilterKeys } from '@/actions/filters';
import { TemplatePreviewDrawer } from '@/components/template-editor/TemplatePreviewDrawer';

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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
              <div className="space-y-2">
                {allCategories.map((category: any) => (
                  <div key={category._id} className="flex items-center space-x-2">
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

      {/* Preview Drawer */}
      <TemplatePreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        templateId={previewTemplateId || undefined}
      />
    </div>
  );
}
