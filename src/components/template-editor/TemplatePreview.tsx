/**
 * TemplatePreview Component
 * Preview dialog for email template with desktop/mobile views
 */

import { Monitor, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

export interface TemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContent: string;
  device?: 'desktop' | 'mobile';
  onDeviceChange?: (device: 'desktop' | 'mobile') => void;
}

export function TemplatePreview({
  open,
  onOpenChange,
  htmlContent,
  device = 'desktop',
  onDeviceChange,
}: TemplatePreviewProps) {
  const cleanHtmlForMobile = (html: string): string => {
    // Remove fixed widths and heights that break mobile layout
    let cleaned = html.replace(/(width|max-width|height|max-height)="[^"]*"/gi, '');
    cleaned = cleaned.replace(/(width|max-width|height|max-height)\s*:\s*[^;]+;?/gi, '');
    return cleaned;
  };

  const processedContent = device === 'mobile' ? cleanHtmlForMobile(htmlContent) : htmlContent;

  if (!htmlContent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>No content to preview</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Add some content to your template to see the preview.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Preview how your template will look to recipients
              </DialogDescription>
            </div>
            {onDeviceChange && (
              <div className="flex items-center gap-2">
                <Button
                  variant={device === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onDeviceChange('desktop')}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Desktop
                </Button>
                <Button
                  variant={device === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onDeviceChange('mobile')}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Mobile
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted p-4">
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
            .preview-mobile .footer-poweredby {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              text-align: center !important;
              gap: 4px !important;
              font-size: 14px !important;
              color: #fff !important;
              flex-wrap: wrap !important;
              white-space: normal !important;
            }
            .preview-mobile .footer-poweredby > a {
              display: inline-flex !important;
              align-items: center !important;
              gap: 4px !important;
              margin: 0 !important;
              color: #fff !important;
              text-decoration: none !important;
            }
            .preview-mobile .footer-poweredby img[alt="Public Circles"] {
              height: 20px !important;
              width: auto !important;
              max-width: 120px !important;
              margin: 0 !important;
              vertical-align: middle !important;
              display: inline-block !important;
              background-color: transparent !important;
            }
            .preview-mobile .footer-poweredby span {
              color: #fff !important;
              font-size: 14px !important;
              vertical-align: middle !important;
              white-space: normal !important;
            }
            .preview-mobile .separator-dot {
              display: none !important;
            }
            .preview-mobile a[href*="unsubscribe"],
            .preview-mobile a[href*="Unsubscribe"] {
              color: #fff !important;
              text-decoration: underline !important;
              white-space: normal !important;
              word-break: break-word !important;
            }
            .preview-mobile tbody[style*="background-color: #000000"],
            .preview-mobile tbody[style*="background-color:#000000"],
            .preview-mobile tbody[style*="background-color: black"],
            .preview-mobile tbody[style*="background-color:black"] {
              width: 100% !important;
              max-width: 100% !important;
            }
          `}</style>
          <div className="h-full overflow-auto">
            <div
              className={`mx-auto bg-white shadow-lg ${
                device === 'mobile' ? 'max-w-sm preview-mobile' : 'max-w-4xl'
              }`}
              style={{
                transform: device === 'mobile' ? 'scale(0.8)' : 'scale(1)',
                transformOrigin: 'top center',
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(processedContent, {
                    WHOLE_DOCUMENT: true,
                    ADD_TAGS: ['style'],
                    ADD_ATTR: ['style'],
                  }),
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
