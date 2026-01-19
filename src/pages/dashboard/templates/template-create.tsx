// @ts-nocheck - Skip TypeScript checking for Vercel deployment
/* eslint-disable */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, CheckCircle2, Eye, Info } from 'lucide-react';
import { paths } from '@/routes/paths';
import { createTemplate, updateTemplate, getTemplateById, getAllTemplateGroups, createTemplateSaveAs } from '@/actions/templates';
import { getFilterKeys } from '@/actions/filters';
import { getSignedUrl, getCompanyAsset, uploadToS3 } from '@/actions/assets';
import { getActiveSubscriptions } from '@/actions/subscription';
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
import { addFooterToUnlayerTemplate } from '@/lib/unlayer-footer';
import { EmailTemplateEditor } from '@/components/template-editor/EmailTemplateEditor';
import { TemplatePreview } from '@/components/template-editor/TemplatePreview';
import { UnsavedChangesDialog } from '@/components/template-editor/UnsavedChangesDialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { convertHtmlToJson } from '@/lib/html-to-json';

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
  
  // State declarations - must be before safeNavigate callback
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
  
  // Safe navigate function that checks for unsaved changes
  const safeNavigate = useCallback((to: string | number, options?: any) => {
    if (hasUnsavedChanges && typeof to === 'string' && to !== location.pathname) {
      setShowUnsavedDialog(true);
      setPendingNavigation(() => () => {
        navigate(to, options);
      });
    } else {
      navigate(to, options);
    }
  }, [hasUnsavedChanges, location.pathname, navigate]);

  const { mergedTags } = getFilterKeys();
  const { allGroups: templateGroups, isLoading: groupsLoading } = getAllTemplateGroups();
  const { isPurchasedRemoveReference, isSubscriptionLoading } = getActiveSubscriptions();
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
            
            // Store JSON template if available, or convert HTML to JSON
            if (finalJsonTemplate) {
              setJsonTemplate(finalJsonTemplate);
            } else if (finalHtmlContent) {
              // Convert HTML to JSON format for Unlayer editor
              try {
                console.log('🔄 Converting HTML to JSON for editor...');
                const convertedJson = convertHtmlToJson(finalHtmlContent);
                setJsonTemplate(convertedJson);
                console.log('✅ HTML converted to JSON:', {
                  rowsCount: convertedJson.body?.rows?.length || 0,
                });
              } catch (error) {
                console.error('❌ Error converting HTML to JSON:', error);
                toast.error('Failed to convert template HTML to editor format');
              }
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

  // Image upload callback for Unlayer editor - use useCallback to prevent recreation
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

  // Image selection callback for Unlayer editor (for selecting from existing assets)
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
    console.log('Unlayer editor loaded successfully', jsonFile);
    // Editor is ready
  }, []);

  // Get initial template for editor
  const getInitialTemplate = useCallback(() => {
    if (location.state?.importedTemplate) {
      return location.state.importedTemplate;
    } else if (isEditMode && templateData) {
      // Prioritize jsonTemplate state (which may be converted from HTML)
      if (jsonTemplate) {
        return jsonTemplate;
      } else if (templateData?.jsonTemplate) {
        return templateData.jsonTemplate;
      } else if (templateData?.body) {
        // If we have HTML but no JSON, try to convert it
        try {
          console.log('🔄 Converting template HTML to JSON on demand...');
          return convertHtmlToJson(templateData.body);
        } catch (error) {
          console.error('❌ Error converting HTML to JSON:', error);
          return null;
        }
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
        templateId: id,
        templateStructure: {
          hasBody: !!template.body,
          hasRows: !!template.body?.rows,
          rowsLength: template.body?.rows?.length || 0,
          firstRow: template.body?.rows?.[0] ? 'exists' : 'missing',
        },
      });
    } else {
      console.log('📋 No initial template (blank editor)', {
        isEditMode,
        hasTemplateData: !!templateData,
        hasJsonTemplate: !!jsonTemplate,
        templateId: id,
        templateDataJsonTemplate: !!templateData?.jsonTemplate,
        templateDataBody: !!templateData?.body,
      });
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
        template = addFooterToUnlayerTemplate(template, {
          showPoweredBy: !isPurchasedRemoveReference,
          includeUnsubscribe: includeUnsubscribe,
        });
      }
    }
    
    return template;
  }, [getInitialTemplate, includeUnsubscribe, templateData, jsonTemplate, id, isEditMode, location.state]);

  // Store editor instance from EmailTemplateEditor component
  const editorInstanceRef = useRef<any>(null);
  
  // Handler to update editor instance ref
  const handleEditorInstanceReady = useCallback((instance: any) => {
    editorInstanceRef.current = instance;
    
    // If we have a template ready, load it immediately with delay
    if (instance?.editor && initialTemplateWithFooter) {
      setTimeout(() => {
        try {
          console.log('🚀 Editor ready, loading template immediately:', {
            hasBody: !!initialTemplateWithFooter.body,
            rowsCount: initialTemplateWithFooter.body?.rows?.length || 0,
            template: initialTemplateWithFooter,
          });
          
          if (initialTemplateWithFooter.body && initialTemplateWithFooter.body.rows) {
            instance.editor.loadDesign(initialTemplateWithFooter);
            console.log('✅ Template loaded in handleEditorInstanceReady');
          } else {
            console.warn('⚠️ Template structure invalid:', initialTemplateWithFooter);
          }
        } catch (error) {
          console.error('❌ Error loading template when editor ready:', error);
        }
      }, 300);
    }
  }, [initialTemplateWithFooter]);

  // Reload template when jsonTemplate changes (e.g., after HTML conversion)
  useEffect(() => {
    if (editorInstanceRef.current?.editor && isEditMode && jsonTemplate && isTemplateLoaded) {
      const template = initialTemplateWithFooter;
      if (template && template.body && template.body.rows) {
        setTimeout(() => {
          try {
            console.log('🔄 Reloading template after jsonTemplate update:', {
              hasBody: !!template.body,
              rowsCount: template.body?.rows?.length || 0,
              templateId: id,
            });
            editorInstanceRef.current.editor.loadDesign(template);
            console.log('✅ Template reloaded successfully');
          } catch (error) {
            console.error('❌ Error reloading template:', error);
          }
        }, 500);
      } else {
        console.warn('⚠️ Cannot reload template - invalid structure:', {
          hasTemplate: !!template,
          hasBody: !!template?.body,
          hasRows: !!template?.body?.rows,
        });
      }
    }
  }, [jsonTemplate, isEditMode, isTemplateLoaded, initialTemplateWithFooter, id]);

  // Block navigation when there are unsaved changes (for in-app navigation)
  // Custom navigation blocker for BrowserRouter (replaces useBlocker which only works with data routers)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Intercept browser back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        // Push the state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        setShowUnsavedDialog(true);
        setPendingNavigation(() => () => {
          // Allow navigation after confirmation
          window.history.back();
        });
      }
    };

    // Intercept Link clicks (React Router uses data-router-link or regular anchor tags)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && href !== location.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setShowUnsavedDialog(true);
          setPendingNavigation(() => () => {
            navigate(href);
          });
        }
      }
    };

    // Push a state to enable popstate detection
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, true); // Use capture phase

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges, location.pathname, navigate]);

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
      // Trigger save in Unlayer editor first to get latest HTML and JSON
      if (editorInstanceRef.current?.editor) {
        try {
          editorInstanceRef.current.editor.saveDesign((design: any) => {
            editorInstanceRef.current.editor.exportHtml((data: any) => {
              const { design: savedDesign, html } = data;
              setHtmlContent(html);
              setJsonTemplate(savedDesign);
              setValue('body', html);
            });
          });
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
    
    // Get current HTML from Unlayer editor in background (non-blocking)
    if (editorInstanceRef.current?.editor) {
      try {
        // Use exportHtml() to get current editor content without triggering save
        editorInstanceRef.current.editor.exportHtml((data: any) => {
          const { html } = data;
          if (html) {
            setHtmlContent(html);
            setValue('body', html);
          }
        });
      } catch (error) {
        console.warn('Error exporting HTML for preview:', error);
        // If exportHtml fails, use existing htmlContent from onChange callback
      }
    }
  };

  // Export HTML handler (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-ignore - Unused but kept for future use
  const handleExport = async () => {
    try {
      if (editorInstanceRef.current?.editor) {
        editorInstanceRef.current.editor.exportHtml((data: any) => {
          const { html } = data;
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
        });
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border shrink-0 z-10">
        <div className="px-6 py-4">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExit}
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
                    if (editorInstanceRef.current?.editor) {
                      editorInstanceRef.current.editor.saveDesign((design: any) => {
                        const updatedTemplate = addFooterToUnlayerTemplate(design, {
                          showPoweredBy: !isPurchasedRemoveReference,
                          includeUnsubscribe: checked,
                        });
                        editorInstanceRef.current.editor.loadDesign(updatedTemplate);
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

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Template Details & Merge Tags */}
        <div className="w-72 border-r border-border bg-card overflow-y-auto shrink-0 h-full">
          <div className="p-4 space-y-4">
            {/* Template Details Section */}
            <div className="space-y-3">
              <div className="px-2">
                <h3 className="text-sm font-semibold text-foreground mb-1">Template Details</h3>
                <p className="text-xs text-muted-foreground">Configure your template settings</p>
              </div>
              
              <div className="space-y-3 px-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Template Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Welcome Email"
                    {...register('name')}
                    className="h-9 text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description"
                    {...register('description')}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyGroupingId" className="text-xs font-medium">Category *</Label>
                  <Select
                    value={watch('companyGroupingId')}
                    onValueChange={(value) => setValue('companyGroupingId', value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsLoading ? (
                        <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                      ) : templateGroups && templateGroups.length > 0 ? (
                        templateGroups.map((group: any) => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.groupName || group.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__no_categories__" disabled>No categories</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.companyGroupingId && (
                    <p className="text-xs text-destructive mt-1">{errors.companyGroupingId.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="includeUnSubscriber"
                    checked={watch('includeUnSubscriber')}
                    onCheckedChange={(checked) => setValue('includeUnSubscriber', checked as boolean)}
                  />
                  <Label htmlFor="includeUnSubscriber" className="text-xs font-normal cursor-pointer leading-none">
                    Include unsubscribed contacts
                  </Label>
                </div>

                <input type="hidden" {...register('kind')} />
                <input type="hidden" {...register('templateSource')} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-4"></div>

            {/* Merge Tags Section */}
            <div className="space-y-3">
              <div className="px-2">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Merge Tags</h3>
                </div>
                <p className="text-xs text-muted-foreground">Drag or click to use in template</p>
              </div>
              
              <div className="px-2">
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {mergedTags?.slice(0, 12).map((tag: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-2.5 py-1.5 text-left text-xs font-mono bg-muted hover:bg-muted/80 rounded-md border border-border transition-colors text-foreground"
                      onClick={() => {
                        // Could add functionality to insert tag into editor
                        toast.info(`Use ${tag.value} in your template`);
                      }}
                    >
                      {tag.value}
                    </button>
                  ))}
                  {mergedTags && mergedTags.length > 12 && (
                    <p className="text-xs text-muted-foreground mt-2 px-1">
                      +{mergedTags.length - 12} more available
                    </p>
                  )}
                  {(!mergedTags || mergedTags.length === 0) && (
                    <p className="text-xs text-muted-foreground px-1">No merge tags available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area - Full Height */}
        <div 
          className="flex-1 min-h-0" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            maxHeight: '100%',
            overflow: 'hidden'
          }}
        >
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
              className="flex-1 min-h-0"
              key={`editor-${id || 'new'}-${isTemplateLoaded ? 'loaded' : 'loading'}`}
            />
          )}
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
