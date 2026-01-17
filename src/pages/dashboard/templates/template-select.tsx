import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllSampleTemplates, getAllTemplates, getTemplateById } from '@/actions/templates';
import { getFilterKeys } from '@/actions/filters';
import { convertHtmlToJson } from '@/lib/html-to-json';
import { paths } from '@/routes/paths';
import { toast } from 'sonner';
import {
  FileCode,
  Code,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function TemplateSelectPage() {
  const navigate = useNavigate();
  const { allSampleTemplates, isLoading: sampleLoading } = getAllSampleTemplates();
  const { tempTemplates: allTemplates, templatesLoading } = getAllTemplates();
  const { mergedTags } = getFilterKeys();
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [validationError, setValidationError] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateHtml = (html: string): string | null => {
    if (!html || html.trim() === '') {
      return 'HTML content is empty';
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) {
        return 'Invalid HTML: The HTML structure contains errors.';
      }

      const hasHtmlTag = doc.querySelector('html');
      const hasBodyTag = doc.querySelector('body');

      const errors: string[] = [];
      if (!hasHtmlTag) errors.push('Missing <html> tag');
      if (!hasBodyTag) errors.push('Missing <body> tag');

      const doctype =
        html.trim().toLowerCase().startsWith('<!doctype html') ||
        html.trim().toLowerCase().startsWith('<html');

      if (!doctype) {
        errors.push('Missing DOCTYPE or proper HTML structure');
      }

      if (errors.length > 0) {
        return `Invalid HTML: ${errors.join(', ')}`;
      }

      return null;
    } catch (error: any) {
      return `Invalid HTML: ${error.message}`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.html')) {
        setValidationError('Selected file is not an HTML file');
        setSelectedFile(null);
        return;
      }

      setValidationError('');
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setHtmlContent(content);
      };
      reader.onerror = () => {
        setValidationError('Failed to read the file');
        setSelectedFile(null);
      };
      reader.readAsText(file);
    }
  };

  const handleHtmlPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setHtmlContent(content);
    if (!content.trim()) {
      setValidationError('');
    }
  };

  const handleImport = () => {
    if (!htmlContent || htmlContent.trim() === '') {
      setValidationError('Please provide HTML content to import');
      return;
    }

    const error = validateHtml(htmlContent);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsUploading(true);

    try {
      const json = convertHtmlToJson(htmlContent);
      navigate(paths.dashboard.template.create, {
        state: {
          importedTemplate: json,
          source: importMethod === 'paste' ? 'HTML_CODE_IMPORT' : 'HTML_FILE_IMPORT',
          filterKeysData: mergedTags,
        },
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Error importing HTML:', error);
      setValidationError('Failed to import HTML. Please try again.');
      setIsUploading(false);
    }
  };

  const switchImportMethod = (method: 'file' | 'paste') => {
    if (method !== importMethod) {
      resetStates();
      setImportMethod(method);
    }
  };

  const resetStates = () => {
    setHtmlContent('');
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseDialog = () => {
    setOpenImportDialog(false);
    resetStates();
    setImportMethod('file');
    setIsUploading(false);
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

  const handleStartFromScratch = () => {
    navigate(paths.dashboard.template.create, {
      state: {
        source: 'SCRATCH',
        filterKeysData: mergedTags,
      },
    });
  };


  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
            <BreadcrumbLink asChild>
              <a href={paths.dashboard.template.root} onClick={(e) => { e.preventDefault(); navigate(paths.dashboard.template.root); }}>
                Templates
              </a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Template</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create Template</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Choose from existing templates, start from scratch, or import HTML
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Start from Scratch */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group relative overflow-hidden"
          onClick={handleStartFromScratch}
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Sparkles className="h-16 w-16 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-center">Start from Scratch</h3>
          </CardContent>
        </Card>

        {/* Import HTML */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group relative overflow-hidden"
          onClick={() => setOpenImportDialog(true)}
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
            <FileCode className="h-16 w-16 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-center">Import HTML</h3>
          </CardContent>
        </Card>

        {/* Existing Templates */}
        {templatesLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : (
          Array.isArray(allTemplates) &&
          allTemplates.map((template: any) => (
            <Card
              key={template._id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group relative overflow-hidden"
              onClick={() => handleUseTemplate(template._id)}
            >
              {loadingTemplateId === template._id && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                {template.thumbnailURL && !imageErrors.has(template._id) ? (
                  <img
                    src={template.thumbnailURL}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => {
                      // Handle CORS or image load errors gracefully
                      setImageErrors((prev) => new Set(prev).add(template._id));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-center line-clamp-2">{template.name}</h3>
              </CardContent>
            </Card>
          ))
        )}

        {/* Sample Templates */}
        {sampleLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : (
          Array.isArray(allSampleTemplates) &&
          allSampleTemplates.map((template: any) => (
            <Card
              key={template._id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group relative overflow-hidden"
              onClick={() => handleUseTemplate(template._id)}
            >
              {loadingTemplateId === template._id && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                {template.thumbnailURL && !imageErrors.has(template._id) ? (
                  <img
                    src={template.thumbnailURL}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => {
                      // Handle CORS or image load errors gracefully
                      setImageErrors((prev) => new Set(prev).add(template._id));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-center line-clamp-2">{template.name}</h3>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Import HTML Dialog */}
      <Dialog open={openImportDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import HTML Template</DialogTitle>
            <DialogDescription>
              Choose one of the options below to import an HTML template.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Upload File Option */}
            <Card
              className={cn(
                'cursor-pointer transition-all p-4',
                importMethod === 'file'
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border hover:border-primary/50'
              )}
              onClick={() => switchImportMethod('file')}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <FileCode
                  className={cn(
                    'h-12 w-12',
                    importMethod === 'file' ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div>
                  <h3 className="font-semibold">Upload HTML File</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select an HTML file from your device
                  </p>
                </div>
                {importMethod === 'file' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Choose File
                  </Button>
                )}
                {selectedFile && importMethod === 'file' && (
                  <p className="text-xs text-muted-foreground italic">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </Card>

            {/* Paste Code Option */}
            <Card
              className={cn(
                'cursor-pointer transition-all p-4',
                importMethod === 'paste'
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border hover:border-primary/50'
              )}
              onClick={() => switchImportMethod('paste')}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <Code
                  className={cn(
                    'h-12 w-12',
                    importMethod === 'paste' ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div>
                  <h3 className="font-semibold">Paste HTML Code</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Directly paste your HTML code here
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".html"
            onChange={handleFileChange}
            className="hidden"
          />

          {importMethod === 'paste' && (
            <div className="space-y-2">
              <Label htmlFor="html-content">Paste HTML code</Label>
              <Textarea
                id="html-content"
                rows={10}
                value={htmlContent}
                onChange={handleHtmlPaste}
                placeholder="<!DOCTYPE html>..."
                className="font-mono text-sm"
              />
            </div>
          )}

          {validationError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {validationError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!htmlContent || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import HTML'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
