// @ts-nocheck - Skip TypeScript checking for Vercel deployment
/* eslint-disable */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useBlocker, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Home, ArrowLeft, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { paths } from '@/routes/paths';
import { createTemplate, updateTemplate, getTemplateById, getAllTemplateGroups, createTemplateSaveAs } from '@/actions/templates';
import { getFilterKeys } from '@/actions/filters';
import { getSignedUrl, getCompanyAsset, uploadToS3 } from '@/actions/assets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { FileManagerDialog } from '@/components/file-manager/FileManagerDialog';
import { addFooterToBeeTemplate } from '@/lib/bee-footer';
import { EmailTemplateEditor } from '@/components/template-editor/EmailTemplateEditor';
import { TemplatePreview } from '@/components/template-editor/TemplatePreview';
import { UnsavedChangesDialog } from '@/components/template-editor/UnsavedChangesDialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  body: z.string().optional(),
  description: z.string().optional(),
  companyGroupingId: z.string().min(1, 'Template category is required'),
  includeUnSubscriber: z.boolean().default(false),
  kind: z.enum(['REGULAR', 'SAMPLE']).default('REGULAR'),
  templateSource: z.enum(['SCRATCH', 'HTML_FILE_IMPORT', 'HTML_CODE_IMPORT', 'SAMPLE_TEMPLATE']).default('SCRATCH'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function TemplateCreatePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [templateData, setTemplateData] = useState<any>(null);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  const [jsonTemplate, setJsonTemplate] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSaveAs, setIsSaveAs] = useState(false);
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(true);
  const [openFileManager, setOpenFileManager] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSelectCallback, setImageSelectCallback] = useState<((result: { url: string }) => void) | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const { mergedTags } = getFilterKeys();
  const { allGroups: templateGroups, isLoading: groupsLoading } = getAllTemplateGroups();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm<TemplateFormValues>({
    // @ts-ignore - Type mismatch between zod schema and react-hook-form types
    resolver: zodResolver(templateSchema) as any,
    defaultValues: {
      name: '',
      body: '',
      description: '',
      companyGroupingId: '',
      includeUnSubscriber: false,
      kind: 'REGULAR',
      templateSource: 'SCRATCH',
    },
  });

  const templateName = watch('name');

  // Load template data if editing
  useEffect(() => {
    if (id) {
      setIsTemplateLoaded(false);
      getTemplateById(id)
        .then((response) => {
          if (response?.data?.data) {
            const template = response.data.data;
            setTemplateData(template);
            
            // Check for autosave data first (newer than server data)
            const autosaveKey = `template-autosave-${id}`;
            const autosaveData = localStorage.getItem(autosaveKey);
            let finalJsonTemplate = template.jsonTemplate;
            let finalHtmlContent = template.body;
            
            if (autosaveData) {
              try {
                const parsed = JSON.parse(autosaveData);
                const autosaveTime = new Date(parsed.timestamp);
                const templateTime = template.updatedAt ? new Date(template.updatedAt) : new Date(0);
                
                // Use autosave if it's newer
                if (autosaveTime > templateTime && parsed.jsonTemplate) {
                  finalJsonTemplate = parsed.jsonTemplate;
                  finalHtmlContent = parsed.htmlContent || template.body;
                  toast.info('Restored unsaved changes from autosave');
                }
              } catch (error) {
                console.error('Error parsing autosave data:', error);
              }
            }
            
            // Set form values including required fields
            reset({
              name: template.name || '',
              body: finalHtmlContent || '',
              description: template.description || '',
              companyGroupingId: template.companyGroupingId?._id || template.companyGroupingId || '',
              includeUnSubscriber: template.includeUnSubscriber || false,
              kind: template.kind || 'REGULAR',
              templateSource: template.templateSource || 'SCRATCH',
            });
            
            if (finalHtmlContent) {
              setHtmlContent(finalHtmlContent);
            }
            
            // Store JSON template if available
            if (finalJsonTemplate) {
              setJsonTemplate(finalJsonTemplate);
            }
            
            setIsTemplateLoaded(true);
          } else {
            setIsTemplateLoaded(true);
          }
        })
        .catch((error: any) => {
          console.error('Error loading template:', error);
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load template';
          
          // Provide more specific error messages
          if (error?.response?.status === 404) {
            toast.error('Template not found. It may have been deleted.');
            // Navigate back after a short delay if template doesn't exist
            setTimeout(() => navigate(paths.dashboard.template.root), 2000);
          } else if (error?.response?.status === 403) {
            toast.error('You do not have permission to access this template.');
            setTimeout(() => navigate(paths.dashboard.template.root), 2000);
          } else {
            toast.error(errorMessage);
          }
          
          setIsTemplateLoaded(true);
        });
    } else {
      // Check for draft autosave for new templates
      const draftAutosave = localStorage.getItem('template-autosave-new');
      if (draftAutosave) {
        try {
          const parsed = JSON.parse(draftAutosave);
          if (parsed.jsonTemplate) {
            setJsonTemplate(parsed.jsonTemplate);
            if (parsed.htmlContent) {
              setHtmlContent(parsed.htmlContent);
              setValue('body', parsed.htmlContent);
            }
            toast.info('Restored draft from autosave');
          }
        } catch (error) {
          console.error('Error parsing draft autosave:', error);
        }
      }
      setIsTemplateLoaded(true);
    }

    // Handle imported template from location state
    if (location.state?.importedTemplate) {
      const importedTemplate = location.state.importedTemplate;
      setJsonTemplate(importedTemplate);
      setTemplateData({
        templateSource: location.state.source || 'SCRATCH',
      });
      if (location.state.source) {
        setValue('templateSource', location.state.source);
      }
    }
  }, [id, reset, setValue, location.state]);

  // Prepare merge tags for editor
  const editorMergeTags = mergedTags?.map((tag: any) => ({
    name: tag.name || tag.value?.replace(/[{}]/g, ''),
    value: tag.value || `{{${tag.name}}}`,
    style: { color: '#3b82f6', fontWeight: 'bold' },
  })) || [];

  // Image upload callback for Bee editor - use useCallback to prevent recreation
  const uploadImageCallback = useCallback(async (data: any, done: (result: { progress: number; url: string }) => void) => {
    try {
      const fileName = data?.name || `image-${Date.now()}.${data?.type?.split('/')[1] || 'jpg'}`;
      const file = data;

      const signedUrlResponse = await getSignedUrl({ fileName });
      if (signedUrlResponse?.status === 200 || signedUrlResponse?.data?.data) {
        const signedUrl = signedUrlResponse.data?.data?.signedUrl || signedUrlResponse.data?.signedUrl;
        const assetId = signedUrlResponse.data?.data?.assetId || signedUrlResponse.data?.assetId;

        const uploadSuccess = await uploadToS3(file, signedUrl);
        if (uploadSuccess) {
          const assetResponse = await getCompanyAsset(assetId);
          if (assetResponse?.status === 200 || assetResponse?.data?.data) {
            const assetUrl = assetResponse.data?.data?.url || assetResponse.data?.url;
            done({ progress: 100, url: assetUrl });
          } else {
            toast.error('Failed to get uploaded image URL');
            done({ progress: 0, url: '' });
          }
        } else {
          toast.error('Failed to upload image');
          done({ progress: 0, url: '' });
        }
      } else {
        toast.error('Failed to get upload URL');
        done({ progress: 0, url: '' });
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error?.message || 'Failed to upload image');
      done({ progress: 0, url: '' });
    }
  }, []);

  // Image selection callback for Bee editor (for selecting from existing assets)
  const selectImageCallback = useCallback(async (_data: any, done: (result: { url: string }) => void) => {
    // Open file manager dialog
    setImageSelectCallback(() => done);
    setOpenFileManager(true);
  }, []);

  // Editor callbacks
  const handleEditorSave = useCallback((jsonFile: any, htmlFile: string) => {
    setValue('body', htmlFile);
    setHtmlContent(htmlFile);
    if (jsonFile) {
      setJsonTemplate(jsonFile);
    }
  }, [setValue]);

  const handleEditorChange = useCallback((jsonFile: any, response: any) => {
    if (jsonFile) {
      setJsonTemplate(jsonFile);
      setHasUnsavedChanges(true);
    }
    if (response?.html) {
      setHtmlContent(response.html);
    }
  }, []);

  const handleEditorAutoSave = useCallback(async (jsonFile: any) => {
    if (jsonFile) {
      setJsonTemplate(jsonFile);
      try {
        const autoSaveData = {
          jsonTemplate: jsonFile,
          htmlContent: htmlContent,
          timestamp: new Date().toISOString(),
          templateId: id || 'draft',
        };
        localStorage.setItem(`template-autosave-${id || 'new'}`, JSON.stringify(autoSaveData));
        setLastAutoSave(new Date());
      } catch (error) {
        console.error('Error in autosave:', error);
      }
    }
  }, [htmlContent, id]);

  const handleEditorLoad = useCallback((jsonFile: any) => {
    console.log('BeeFree editor loaded successfully', jsonFile);
    // Editor is ready
  }, []);

  // Get initial template for editor
  const getInitialTemplate = useCallback(() => {
    if (location.state?.importedTemplate) {
      return location.state.importedTemplate;
    } else if (isEditMode && templateData) {
      // Prioritize templateData.jsonTemplate for initial load
      // jsonTemplate state is for tracking changes after editor loads
      if (templateData?.jsonTemplate) {
        return templateData.jsonTemplate;
      } else if (jsonTemplate) {
        return jsonTemplate;
      }
    }
    return null;
  }, [location.state, isEditMode, templateData, jsonTemplate]);

  // Determine if editor should be enabled
  const isEditorEnabled = useMemo(() => {
    if (!isTemplateLoaded) return false;
    if (isEditMode && templateData === null) return false;
    return true;
  }, [isTemplateLoaded, isEditMode, templateData]);

  // Prepare initial template with footer if needed
  const initialTemplateWithFooter = useMemo(() => {
    let template = getInitialTemplate();
    
    // Debug logging
    if (template) {
      console.log('📋 Initial template prepared:', {
        hasBody: !!template.body,
        rowsCount: template.body?.rows?.length || 0,
        fromLocationState: !!location.state?.importedTemplate,
        fromEditMode: isEditMode && !!templateData,
      });
    } else {
      console.log('📋 No initial template (blank editor)');
    }
    
    // Add footer if includeUnsubscribe is enabled and template doesn't already have footer
    if (includeUnsubscribe && template && template.body) {
      const hasFooter = template?.body?.rows?.some((row: any) =>
        row.values?._meta?.htmlID?.includes('footer') ||
        row.columns?.some((column: any) =>
          column.contents?.some((content: any) =>
            content.values?.text?.includes('Powered by') ||
            content.values?.text?.includes('{{unsubscribe}}')
          )
        )
      );
      
      if (!hasFooter) {
        template = addFooterToBeeTemplate(template, {
          showPoweredBy: true,
          includeUnsubscribe: includeUnsubscribe,
        });
      }
    }
    
    return template;
  }, [getInitialTemplate, includeUnsubscribe]);

  // Store editor instance from EmailTemplateEditor component
  const editorInstanceRef = useRef<any>(null);
  
  // Handler to update editor instance ref
  const handleEditorInstanceReady = useCallback((instance: any) => {
    editorInstanceRef.current = instance;
  }, []);

  // Block navigation when there are unsaved changes (for in-app navigation)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Show confirmation dialog when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowUnsavedDialog(true);
      setPendingNavigation(() => () => {
        blocker.proceed();
      });
    }
  }, [blocker]);

  // Warn about unsaved changes when closing browser tab/window
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Cleanup is handled by EmailTemplateEditor component

  // Helper function to check if HTML content is empty
  const isContentEmpty = (content: string | undefined | null): boolean => {
    if (!content) return true;
    // Remove HTML tags and whitespace
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    // Check if there's any meaningful content
    return textContent.length === 0;
  };

  const onSubmit = async (data: TemplateFormValues) => {
    setIsSaving(true);
    try {
      // Trigger save in Bee editor first to get latest HTML and JSON
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.save();
          // Small delay to ensure onSave callback is executed
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.warn('Error triggering editor save:', error);
        }
      }

      // Validate template content is not empty
      const finalBody = data.body || htmlContent || '';
      if (isContentEmpty(finalBody)) {
        toast.error('Template content cannot be empty. Please add some content to your template.');
        setIsSaving(false);
        return;
      }

      const templatePayload: any = {
        name: data.name,
        body: finalBody,
        kind: data.kind || 'REGULAR',
        companyGroupingId: data.companyGroupingId,
        includeUnSubscriber: data.includeUnSubscriber,
        templateSource: data.templateSource || 'SCRATCH',
      };

      // Include description if provided
      if (data.description) {
        templatePayload.description = data.description;
      }

      // Include jsonTemplate if available (from editor or loaded template)
      const finalJsonTemplate = jsonTemplate || templateData?.jsonTemplate;
      if (finalJsonTemplate) {
        templatePayload.jsonTemplate = finalJsonTemplate;
      }

      let result;
      
      // Handle "Save As" flow - create new template from existing one
      if (isSaveAs && isEditMode && id) {
        result = await createTemplateSaveAs(id, templatePayload);
        if (result?.data || (result as any)?.success) {
          toast.success('Template saved as new successfully');
          setIsSaveAs(false);
          navigate(paths.dashboard.template.root);
          return;
        }
      } else if (isEditMode && id) {
        result = await updateTemplate(id, templatePayload);
      } else {
        result = await createTemplate(templatePayload);
      }

      if (result?.data || (result as any)?.success) {
        // Clear autosave data on successful save
        if (id) {
          localStorage.removeItem(`template-autosave-${id}`);
        } else {
          localStorage.removeItem('template-autosave-new');
        }
        setHasUnsavedChanges(false);
        setLastAutoSave(new Date());
        toast.success(isEditMode ? 'Template updated successfully' : 'Template created successfully');
        navigate(paths.dashboard.template.root);
      } else {
        toast.error('Failed to save template');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save template';
      toast.error(errorMessage);
      console.error('Template save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    // Open preview immediately with existing content if available
    setIsPreviewOpen(true);
    
    // Get current HTML from Bee editor in background (non-blocking)
    if (editorInstanceRef.current) {
      try {
        // Use exportHtml() to get current editor content without triggering save
        const currentHtml = await editorInstanceRef.current.exportHtml();
        if (currentHtml) {
          setHtmlContent(currentHtml);
          setValue('body', currentHtml);
        }
      } catch (error) {
        console.warn('Error exporting HTML for preview:', error);
        // If exportHtml fails, use existing htmlContent from onChange callback
        if (!htmlContent) {
          try {
            // Last resort: trigger save to update htmlContent
            editorInstanceRef.current.save();
          } catch (saveError) {
            console.warn('Error saving before preview:', saveError);
          }
        }
      }
    }
  };

  // Export HTML handler (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-ignore - Unused but kept for future use
  const handleExport = async () => {
    try {
      if (editorInstanceRef.current) {
        const html = await editorInstanceRef.current.exportHtml();
        if (html) {
          // Create a blob and download
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${templateName || 'template'}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('HTML exported successfully');
        }
      }
    } catch (error) {
      console.error('Error exporting HTML:', error);
      toast.error('Failed to export HTML');
    }
  };

  // Handle exit with unsaved changes check (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-ignore - Unused but kept for future use
  const handleExit = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation(() => () => navigate(paths.dashboard.template.root));
    } else {
      navigate(paths.dashboard.template.root);
    }
  }, [hasUnsavedChanges, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
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
                <BreadcrumbLink asChild>
                  <a href={paths.dashboard.template.root} onClick={(e) => { e.preventDefault(); navigate(paths.dashboard.template.root); }}>
                    Templates
                  </a>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isEditMode ? 'Edit Template' : 'Create Template'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(paths.dashboard.template.root)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {isEditMode ? 'Edit Template' : 'Create Template'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isEditMode
                    ? 'Update your email template'
                    : 'Design beautiful email templates with our visual editor'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full sm:w-auto">
              {/* Footer Toggle */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background">
                <Switch
                  id="include-unsubscribe"
                  checked={includeUnsubscribe}
                  onCheckedChange={(checked) => {
                    setIncludeUnsubscribe(checked);
                    // Update footer in editor if it's already loaded
                    if (editorInstanceRef.current) {
                      editorInstanceRef.current.save((design: any) => {
                        const updatedTemplate = addFooterToBeeTemplate(design, {
                          showPoweredBy: true,
                          includeUnsubscribe: checked,
                        });
                        editorInstanceRef.current.load(updatedTemplate);
                        setJsonTemplate(updatedTemplate);
                      });
                    }
                  }}
                />
                <Label htmlFor="include-unsubscribe" className="text-sm font-normal cursor-pointer whitespace-nowrap">
                  Include Footer
                </Label>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-600">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Unsaved changes</span>
                    {lastAutoSave && (
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        (Autosaved {lastAutoSave.toLocaleTimeString()})
                      </span>
                    )}
                  </div>
                )}
                {!hasUnsavedChanges && lastAutoSave && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Saved {lastAutoSave.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreview} className="flex-1 sm:flex-initial">
                  <Eye className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                {isEditMode && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsSaveAs(true);
                      void handleSubmit(onSubmit as any)();
                    }}
                    disabled={isSubmitting || isSaving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save As
                  </Button>
                )}
                <Button onClick={() => void handleSubmit(onSubmit as any)()} disabled={isSubmitting || isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : isEditMode ? 'Update Template' : 'Save Template'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Template Details */}
          <div className="lg:col-span-12">
            <Card className="border shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg font-semibold">Template Details</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Provide basic information about your template
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Welcome Email, Newsletter, Product Launch"
                      {...register('name')}
                      className="max-w-md"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of this template"
                      {...register('description')}
                      className="max-w-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyGroupingId">Template Category *</Label>
                    <Select
                      value={watch('companyGroupingId')}
                      onValueChange={(value) => setValue('companyGroupingId', value)}
                    >
                      <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupsLoading ? (
                          <SelectItem value="" disabled>Loading categories...</SelectItem>
                        ) : templateGroups && templateGroups.length > 0 ? (
                          templateGroups.map((group: any) => (
                            <SelectItem key={group._id} value={group._id}>
                              {group.groupName || group.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No categories available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.companyGroupingId && (
                      <p className="text-sm text-red-500">{errors.companyGroupingId.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeUnSubscriber"
                      checked={watch('includeUnSubscriber')}
                      onCheckedChange={(checked) => setValue('includeUnSubscriber', checked as boolean)}
                    />
                    <Label htmlFor="includeUnSubscriber" className="font-normal cursor-pointer">
                      Include unsubscribed contacts
                    </Label>
                  </div>

                  {/* Hidden fields for kind and templateSource - set based on context */}
                  <input type="hidden" {...register('kind')} />
                  <input type="hidden" {...register('templateSource')} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-12">
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold">Template Editor</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Design your email template using the visual editor
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 relative bg-white" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
                {isEditorEnabled && (
                  <EmailTemplateEditor
                    initialTemplate={initialTemplateWithFooter}
                    mergeTags={editorMergeTags}
                    onSave={handleEditorSave}
                    onChange={handleEditorChange}
                    onLoad={handleEditorLoad}
                    onAutoSave={handleEditorAutoSave}
                    uploadImage={uploadImageCallback}
                    selectImage={selectImageCallback}
                    onInstanceReady={handleEditorInstanceReady}
                    enabled={isEditorEnabled}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <TemplatePreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        htmlContent={htmlContent || watch('body') || ''}
        device={previewDevice}
        onDeviceChange={setPreviewDevice}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={() => {
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
            setHasUnsavedChanges(false);
          }
        }}
        onCancel={() => {
          setPendingNavigation(null);
          if (blocker && 'reset' in blocker && typeof blocker.reset === 'function') {
            blocker.reset();
          }
        }}
      />

      {/* File Manager Dialog */}
      <FileManagerDialog
        open={openFileManager}
        onOpenChange={(open) => {
          setOpenFileManager(open);
          if (!open) {
            setImageSelectCallback(null);
            setSelectedImage(null);
          }
        }}
        onSelect={(url) => {
          setSelectedImage(url);
          if (imageSelectCallback) {
            imageSelectCallback({ url });
            setImageSelectCallback(null);
          }
        }}
        selectedUrl={selectedImage}
      />
    </div>
  );
}
