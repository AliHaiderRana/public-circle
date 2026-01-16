import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BeePlugin from '@mailupinc/bee-plugin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Smartphone, Monitor } from 'lucide-react';
import { paths } from '@/routes/paths';
import { createTemplate, updateTemplate, getTemplateById } from '@/actions/templates';
import { getFilterKeys } from '@/actions/filters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Bee Plugin credentials - should be in env
const BEE_CLIENT_ID = import.meta.env.VITE_BEE_CLIENT_ID || '247b8a08-a490-4f38-be30-e86a02d4b878';
const BEE_CLIENT_SECRET = import.meta.env.VITE_BEE_CLIENT_SECRET || 'NQFLDbUTyjM7jFgzuPaPoz4z4YD3Lu4DXP7pV4I2fI5m8GvYvGhc';

const BEE_TEMPLATE = {
  body: {
    rows: [],
  },
};

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  body: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function TemplateCreatePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [templateData, setTemplateData] = useState<any>(null);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  const [jsonTemplate, setJsonTemplate] = useState<any>(null);

  const { filterKeysData, mergedTags } = getFilterKeys();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch,
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      body: '',
    },
  });

  const templateName = watch('name');
  const templateBody = watch('body');

  // Load template data if editing
  useEffect(() => {
    if (id) {
      setIsTemplateLoaded(false);
      getTemplateById(id)
        .then((response) => {
          if (response?.data?.data) {
            const template = response.data.data;
            setTemplateData(template);
            reset({
              name: template.name || '',
              body: template.body || '',
            });
            if (template.body) {
              setHtmlContent(template.body);
            }
            // Store JSON template if available
            if (template.jsonTemplate) {
              setJsonTemplate(template.jsonTemplate);
            }
            setIsTemplateLoaded(true);
          } else {
            setIsTemplateLoaded(true);
          }
        })
        .catch((error) => {
          console.error('Error loading template:', error);
          toast.error('Failed to load template');
          setIsTemplateLoaded(true);
        });
    } else {
      setIsTemplateLoaded(true);
    }
  }, [id, reset]);

  const onFetchBeeToken = async (clientId: string, clientSecret: string, beeEditor: any) => {
    return await beeEditor.getToken(clientId, clientSecret);
  };

  useEffect(() => {
    const loadBeeEditor = async () => {
      // Validate credentials
      if (!BEE_CLIENT_ID || !BEE_CLIENT_SECRET) {
        toast.error('Bee Plugin credentials are missing. Please configure VITE_BEE_CLIENT_ID and VITE_BEE_CLIENT_SECRET in your .env file.');
        setIsEditorLoading(false);
        return;
      }

      try {
        let beeEditor = new BeePlugin();
        let token = await onFetchBeeToken(BEE_CLIENT_ID, BEE_CLIENT_SECRET, beeEditor);

        // Get merge tags from filters
        const mergeTags =
          mergedTags?.map((tag: any) => ({
            name: tag.name || tag.value?.replace(/[{}]/g, ''),
            value: tag.value || `{{${tag.name}}}`,
            style: { color: '#3b82f6', fontWeight: 'bold' },
          })) || [];

        let config = {
          uid: 'CmsUserName', // [mandatory] - matching original
          container: 'bee-plugin-container', // [mandatory]
          autosave: 30, // [optional, default:false]
          language: 'en-US', // [optional, default:'en-US']
          trackChanges: true, // [optional, default: false]
          preventClose: false, // [optional, default:false]
          editorFonts: {}, // [optional, default: see description]
          contentDialog: {}, // [optional, default: see description]
          defaultForm: {}, // [optional, default: {}]
          roleHash: '', // [optional, default: ""]
          rowDisplayConditions: {}, // [optional, default: {}]
          rowsConfiguration: {},
          mergeTags,
          workspace: {
            // [optional, default: {type : 'default'}]
            editSingleRow: false, // [optional, default: false]},
          },
          commenting: false, // [optional, default: false]}
          commentingThreadPreview: true, // [optional, default: true]}
          commentingNotifications: true, // [optional, default: true]}
          disableLinkSanitize: true, // [optional, default: false]}
          loadingSpinnerDisableOnSave: false, // [optional, default: false]}
          loadingSpinnerDisableOnDialog: true, // [optional, default: false]}
          maxRowsDisplayed: 35, // [optional, set this to any number to define the maximum number of rows that a category should display]}
          onSave: function (jsonFile: any, htmlFile: string) {
            setValue('body', htmlFile);
            setHtmlContent(htmlFile);
            // Store JSON template for saving
            if (jsonFile) {
              setJsonTemplate(jsonFile);
            }
          },
          onChange: function (jsonFile: any, response: any) {
            // Store JSON template on change for saving
            if (jsonFile) {
              setJsonTemplate(jsonFile);
            }
          },
          onSaveAsTemplate: function (jsonFile: any) {
            // Save as template
          },
          onAutoSave: function (jsonFile: any) {
            // Auto-save logic
          },
          onSend: function (htmlFile: string) {
            // Send function
          },
          onLoad: function (jsonFile: any) {
            setIsEditorLoading(false);
            // Template loaded
          },
          onError: function (errorMessage: string) {
            console.error('Bee Plugin Error:', errorMessage);
            toast.error(`Editor error: ${errorMessage}`);
          },
          onWarning: function (alertMessage: string) {
            console.warn('Editor warning:', alertMessage);
          },
          translations: {
            'bee-common-widget-bar': {
              content: 'MODULES',
            },
          },
        };

        // Load existing template if editing, otherwise use blank template
        // Wait for template data to load if in edit mode
        if (isEditMode && !isTemplateLoaded) {
          setIsEditorLoading(false);
          return;
        }

        // Use jsonTemplate if available (for Bee editor), otherwise use blank template
        const initialTemplate = isEditMode && (jsonTemplate || templateData?.jsonTemplate)
          ? (jsonTemplate || templateData.jsonTemplate)
          : (isEditMode ? undefined : BEE_TEMPLATE);
        beeEditor.start(config, initialTemplate);
      } catch (error: any) {
        console.error('Failed to load Bee editor:', error);
        
        // Provide more helpful error messages
        if (error?.response?.status === 400 || error?.code === 'ERR_BAD_REQUEST') {
          toast.error(
            'Bee Plugin authentication failed. Please check your credentials (VITE_BEE_CLIENT_ID and VITE_BEE_CLIENT_SECRET) are valid and not expired.'
          );
        } else {
          toast.error('Failed to initialize template editor: ' + (error?.message || 'Unknown error'));
        }
        
        setIsEditorLoading(false);
      }
    };

    // Only initialize if container exists and template is loaded (if editing)
    if (editorRef.current && (isTemplateLoaded || !isEditMode)) {
      loadBeeEditor();
    }
  }, [id, mergedTags, setValue, htmlContent, isEditMode, isTemplateLoaded, jsonTemplate, templateData]);

  const onSubmit = async (data: TemplateFormValues) => {
    setIsSaving(true);
    try {
      const templatePayload: any = {
        name: data.name,
        body: data.body || htmlContent,
        kind: 'HTML',
      };

      // Include jsonTemplate if available (from editor or loaded template)
      if (jsonTemplate) {
        templatePayload.jsonTemplate = jsonTemplate;
      } else if (templateData?.jsonTemplate) {
        templatePayload.jsonTemplate = templateData.jsonTemplate;
      }

      let result;
      if (isEditMode && id) {
        result = await updateTemplate(id, templatePayload);
      } else {
        result = await createTemplate(templatePayload);
      }

      if (result?.data || result?.success) {
        toast.success(isEditMode ? 'Template updated successfully' : 'Template created successfully');
        navigate(paths.dashboard.template.root);
      } else {
        toast.error('Failed to save template');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const PreviewContent = () => {
    if (!htmlContent && !watch('body')) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-gray-500">No content to preview. Save your template first.</p>
        </div>
      );
    }

    const content = htmlContent || watch('body') || '';

    return (
      <div className="h-full overflow-auto bg-gray-50 p-4">
        <div
          className={`mx-auto bg-white ${
            previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
          } shadow-lg`}
          style={{
            transform: previewDevice === 'mobile' ? 'scale(0.8)' : 'scale(1)',
            transformOrigin: 'top center',
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(paths.dashboard.template.root)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditMode ? 'Edit Template' : 'Create Template'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditMode
                    ? 'Update your email template'
                    : 'Design beautiful email templates with our visual editor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePreview} disabled={!htmlContent && !watch('body')}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : isEditMode ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Template Name Input */}
          <div className="col-span-12">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Give your template a descriptive name</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
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
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="col-span-12">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle>Template Editor</CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                {isEditorLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Loading editor...</p>
                    </div>
                  </div>
                )}
                <div
                  id="bee-plugin-container"
                  ref={editorRef}
                  className="w-full"
                  style={{ minHeight: '600px', height: 'calc(100vh - 300px)' }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
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
          <div className="flex-1 overflow-hidden">
            <PreviewContent />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
