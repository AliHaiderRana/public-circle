import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadCSV } from '@/actions/users';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContactImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ContactImportDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setUploadProgress(0);
      setUploadStatus('idle');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await uploadCSV(
        selectedFile,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      );

      if (response) {
        setUploadStatus('processing');
        setUploadProgress(100);
        
        // Simulate processing phase (backend may send socket events for actual processing)
        setTimeout(() => {
          setUploadStatus('success');
          toast.success('Contacts imported successfully');
          
          setTimeout(() => {
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            onSuccess();
            onOpenChange(false);
          }, 1500);
        }, 1000);
      } else {
        setUploadStatus('error');
        setIsUploading(false);
      }
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      setUploadStatus('error');
      setUploadProgress(0);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to import contacts');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading && abortControllerRef.current) {
      // Cancel the upload if in progress
      abortControllerRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('idle');
    }
    
    if (!isUploading || uploadStatus === 'success') {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import contacts. The file should contain contact information with
            headers in the first row.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm flex-1">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label>
                  {uploadStatus === 'uploading' && 'Uploading file...'}
                  {uploadStatus === 'processing' && 'Processing contacts...'}
                  {uploadStatus === 'success' && 'Import completed!'}
                  {uploadStatus === 'error' && 'Upload failed'}
                </Label>
                <span className="text-muted-foreground font-medium">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {uploadStatus === 'uploading' && (
                <p className="text-xs text-muted-foreground">
                  Please wait while we upload your file...
                </p>
              )}
              {uploadStatus === 'processing' && (
                <p className="text-xs text-muted-foreground">
                  Importing contacts into the system...
                </p>
              )}
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Contacts imported successfully!</span>
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to import contacts. Please try again.</span>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadStatus === 'success'}
          >
            {uploadStatus === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {uploadStatus !== 'success' && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
