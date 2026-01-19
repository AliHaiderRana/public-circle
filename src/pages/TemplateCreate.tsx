import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

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
import { ArrowLeft, Save, Eye, Smartphone, Monitor, Info, Loader2 } from 'lucide-react';
import { paths } from '@/routes/paths';
import { getSignedUrl, getCompanyAsset, uploadToS3 } from '@/actions/assets';

// Dynamic import for EmailTemplateEditor to handle potential loading issues
const EmailTemplateEditor = lazy(() => 
  import('@/components/template-editor/EmailTemplateEditor').then(module => ({ default: module.EmailTemplateEditor }))
);

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  body: z.string().optional(),
});

export default function TemplateCreate() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const editorInstanceRef = useRef<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [jsonTemplate, setJsonTemplate] = useState<any>(null);
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

  // Prepare merge tags for editor
  const editorMergeTags = mergedTags?.map((tag: any) => ({
    name: tag.name || tag.value?.replace(/[{}]/g, ''),
    value: tag.value || `{{${tag.name}}}`,
    style: { color: '#3b82f6', fontWeight: 'bold' },
  })) || [];

  // Image upload callback
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

  // Editor callbacks
  const handleEditorSave = useCallback((jsonFile: any, htmlFile: string) => {
    setHtmlContent(htmlFile);
    setJsonTemplate(jsonFile);
    form.setValue('body', htmlFile);
  }, [form]);

  const handleEditorChange = useCallback((jsonFile: any) => {
    if (jsonFile) {
      setJsonTemplate(jsonFile);
    }
  }, []);

  const handleEditorLoad = useCallback(() => {
    setIsEditorLoading(false);
  }, []);

  const handleEditorInstanceReady = useCallback((instance: any) => {
    editorInstanceRef.current = instance;
  }, []);

  // Get initial template
  const getInitialTemplate = useCallback(() => {
    if (isEditMode && htmlContent) {
      // If editing and we have HTML, try to convert it
      // For now, return null to start fresh or use jsonTemplate if available
      return null;
    }
    return null;
  }, [isEditMode, htmlContent]);

  const handleSave = async () => {
    // Validate template name first
    const values = form.getValues();
    if (!values.name || values.name.trim() === '') {
      toast.error('Please provide a template name');
      return;
    }

    setIsSaving(true);
    try {
      // Trigger save in Unlayer editor to get latest HTML and JSON
      if (editorInstanceRef.current?.editor) {
        editorInstanceRef.current.editor.saveDesign((design: any) => {
          editorInstanceRef.current.editor.exportHtml((data: any) => {
            const { design: savedDesign, html } = data;
            setHtmlContent(html);
            setJsonTemplate(savedDesign);
            form.setValue('body', html);
            
            // Proceed with save
            const templateData = {
              name: values.name,
              body: html,
              kind: 'HTML',
              jsonTemplate: savedDesign,
            };

            (async () => {
              try {
                let result;
                if (isEditMode && id) {
                  result = await updateTemplate(id, templateData);
                } else {
                  result = await createTemplate(templateData);
                }

                if ((result as any)?.success || result?.data) {
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
            })();
          });
        });
      } else {
        // Fallback: submit form directly if editor isn't ready
        if (htmlContent) {
          form.setValue('body', htmlContent);
        }
        const templateData = {
          name: values.name,
          body: htmlContent || values.body || '',
          kind: 'HTML',
          jsonTemplate: jsonTemplate,
        };

        let result;
        if (isEditMode && id) {
          result = await updateTemplate(id, templateData);
        } else {
          result = await createTemplate(templateData);
        }

        if ((result as any)?.success || result?.data) {
          toast.success(isEditMode ? 'Template updated successfully' : 'Template created successfully');
          navigate(paths.dashboard.template.root);
        } else {
          toast.error('Failed to save template');
        }
        setIsSaving(false);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save template');
      setIsSaving(false);
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
    <div className="flex flex-col min-h-screen bg-gray-50">
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

      <div
        className="flex-1 flex overflow-hidden"
        style={{ height: 'calc(100vh - 96px)' }}
      >
        {/* Sidebar - Template Settings */}
        <div className="w-80 border-r bg-white overflow-y-auto shrink-0 h-full">
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

          </div>
        </div>

        {/* Editor Area - Full Width */}
        <div className="flex-1 bg-gray-100 relative h-full min-h-[600px]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading editor...</p>
              </div>
            </div>
          }>
            <EmailTemplateEditor
              initialTemplate={getInitialTemplate()}
              mergeTags={editorMergeTags}
              onSave={handleEditorSave}
              onChange={handleEditorChange}
              onLoad={handleEditorLoad}
              uploadImage={uploadImageCallback}
              onInstanceReady={handleEditorInstanceReady}
              enabled={true}
              className="h-full w-full"
            />
          </Suspense>
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
