import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllAssets, getSignedUrl, uploadToS3, getCompanyAsset } from '@/actions/assets';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  selectedUrl?: string | null;
}

export function FileManagerDialog({ open, onOpenChange, onSelect, selectedUrl }: FileManagerDialogProps) {
  const { allAssets, isLoading } = getAllAssets();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = file.name;
      const signedUrlResponse = await getSignedUrl({ fileName });

      if (signedUrlResponse?.status === 200 || signedUrlResponse?.data?.data) {
        const signedUrl = signedUrlResponse.data?.data?.signedUrl || signedUrlResponse.data?.signedUrl;
        const assetId = signedUrlResponse.data?.data?.assetId || signedUrlResponse.data?.assetId;

        const uploadSuccess = await uploadToS3(file, signedUrl);
        if (uploadSuccess) {
          const assetResponse = await getCompanyAsset(assetId);
          if (assetResponse?.status === 200 || assetResponse?.data?.data) {
            const assetUrl = assetResponse.data?.data?.url || assetResponse.data?.url;
            await mutate('/assets/all');
            toast.success('Image uploaded successfully');
            onSelect(assetUrl);
            onOpenChange(false);
          } else {
            toast.error('Failed to get uploaded image URL');
          }
        } else {
          toast.error('Failed to upload image');
        }
      } else {
        toast.error('Failed to get upload URL');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Select an Image</DialogTitle>
              <DialogDescription>Choose an existing image or upload a new one</DialogDescription>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : allAssets && allAssets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allAssets.map((asset: any) => (
                <div
                  key={asset._id}
                  onClick={() => {
                    onSelect(asset.url);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg',
                    selectedUrl === asset.url
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {asset.url ? (
                    <img
                      src={asset.url}
                      alt={asset.name || 'Asset'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No images found</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Image
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
