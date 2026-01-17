import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
// @ts-ignore
import BeePlugin from '@mailupinc/bee-plugin';

import { createTemplate, updateTemplate, getTemplateById } from '@/actions/templates';
import { getFilterKeys } from '@/actions/filters';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, Eye, Smartphone, Monitor, Info } from 'lucide-react';
import { paths } from '@/routes/paths';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  body: z.string().optional(),
});

// Credentials - from environment variables
const CLIENT_ID = import.meta.env.VITE_BEE_CLIENT_ID || '077ccc41-3e5f-44b3-9062-b0a590f6b67f';
const CLIENT_SECRET = import.meta.env.VITE_BEE_CLIENT_SECRET || 'NQFLDbUTyjM7jFgzuPaPoz4z4YD3Lu4DXP7pV4I2fI5m8GvYvGhc';

const BEE_TEMPLATE = {
  body: {
    rows: [],
  },
};

export default function TemplateCreate() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [beeEditor, setBeeEditor] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const isEditMode = !!id;

  const { mergedTags } = getFilterKeys();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      body: '',
    },
  });

  // Load template if editing
  useEffect(() => {
    if (id) {
      getTemplateById(id).then((response) => {
        if (response?.data?.data) {
          const template = response.data.data;
          form.reset({
            name: template.name || '',
            body: template.body || '',
          });
          setHtmlContent(template.body || '');
        }
      });
    }
  }, [id, form]);

  const onSubmitRef = useRef<(values: z.infer<typeof formSchema>) => Promise<void>>();

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const templateData = {
        name: values.name,
        body: values.body || htmlContent,
        kind: 'HTML',
      };

      let result;
      if (isEditMode && id) {
        result = await updateTemplate(id, templateData);
      } else {
        result = await createTemplate(templateData);
      }

      if (result?.success || result?.data) {
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
  }, [htmlContent, isEditMode, id, navigate]);

  onSubmitRef.current = onSubmit;

  const onFetchBeeToken = async (clientId: string, clientSecret: string, beeEditor: any) => {
    try {
      return await beeEditor.getToken(clientId, clientSecret);
    } catch (error: any) {
      console.error('BeeFree getToken error:', error);
      // If token fetch fails, throw a more descriptive error
      throw new Error('Failed to authenticate with BeeFree editor. Please check your network connection and try again.');
    }
  };

  useEffect(() => {
    const loadBeeEditor = async () => {
      try {
        let beeEditor = new BeePlugin();
        
        // Fetch token with error handling - continue even if it fails
        let token;
        try {
          token = await onFetchBeeToken(CLIENT_ID, CLIENT_SECRET, beeEditor);
        } catch (tokenError: any) {
          console.warn('Token fetch failed, continuing anyway:', tokenError);
          // Continue initialization - the plugin might handle auth internally
        }

        // Prepare merge tags from filters
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
            setHtmlContent(htmlFile);
            form.setValue('body', htmlFile);
          },
          onChange: function (jsonFile: any, response: any) {
            // Track changes
          },
          onSaveAsTemplate: function (jsonFile: any) {
            // Save as template
          },
          onAutoSave: function (jsonFile: any) {
            // Auto-save tracking
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
            // Only show error if it's not an authentication error (those are handled in catch block)
            if (!errorMessage.toLowerCase().includes('authentication') && !errorMessage.toLowerCase().includes('credentials')) {
              toast.error('Editor error: ' + errorMessage);
            }
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
        const initialTemplate = htmlContent ? undefined : BEE_TEMPLATE;
        beeEditor.start(config, initialTemplate);
        setBeeEditor(beeEditor);
      } catch (error: any) {
        console.error('Failed to init Bee Plugin', error);
        
        // Provide more helpful error messages
        console.error('Bee Plugin initialization error:', error);
        toast.error('Failed to load template editor: ' + (error?.message || 'Unknown error'));
        
        setIsEditorLoading(false);
      }
    };

    // Only initialize if container exists
    if (editorRef.current) {
      loadBeeEditor();
    }
  }, [mergedTags, form, htmlContent]);

  const handleSave = async () => {
    // Validate template name first
    const values = form.getValues();
    if (!values.name || values.name.trim() === '') {
      toast.error('Please provide a template name');
      return;
    }

    if (beeEditor) {
      // Trigger save in Bee editor, which will call onSave callback
      // The onSave callback will update the form with HTML content
      beeEditor.save();
      
      // Small delay to ensure onSave callback is executed
      setTimeout(() => {
        const finalValues = form.getValues();
        if (finalValues.body || htmlContent) {
          onSubmit(finalValues);
        } else {
          toast.error('Please create some content in the editor');
        }
      }, 500);
    } else {
      // Fallback: submit form directly if editor isn't ready
      if (htmlContent) {
        form.setValue('body', htmlContent);
      }
      form.handleSubmit(onSubmit)();
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const PreviewContent = () => {
    const content = htmlContent || form.watch('body') || '';
    if (!content) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-gray-500">No content to preview. Save your template first.</p>
        </div>
      );
    }

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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Modern Header */}
      <div className="border-b bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(paths.dashboard.template.root)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditMode ? 'Edit Template' : 'Create Template'}
                </h1>
                <p className="text-sm text-gray-500">
                  Design beautiful email templates with our visual editor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!htmlContent && !form.watch('body')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Template Settings */}
        <div className="w-80 border-r bg-white overflow-y-auto shrink-0">
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>Basic information about your template</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g. Welcome Email, Newsletter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="hidden">
                      <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => <Input type="hidden" {...field} />}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Merge Tags
                </CardTitle>
                <CardDescription>Available dynamic fields for your template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mergedTags?.slice(0, 10).map((tag: any, index: number) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-50 rounded-md text-sm font-mono text-blue-700"
                    >
                      {tag.value}
                    </div>
                  ))}
                  {mergedTags && mergedTags.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{mergedTags.length - 10} more tags available
                    </p>
                  )}
                  {(!mergedTags || mergedTags.length === 0) && (
                    <p className="text-sm text-gray-500">No merge tags available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">Tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use merge tags to personalize emails</li>
                <li>Save regularly to avoid losing work</li>
                <li>Preview before sending campaigns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Editor Area - Full Width */}
        <div className="flex-1 bg-gray-100 relative">
          {isEditorLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading editor...</p>
              </div>
            </div>
          )}
          <div
            ref={editorRef}
            id="bee-plugin-container"
            className="h-full w-full absolute inset-0"
            style={{ minHeight: '600px' }}
          />
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
