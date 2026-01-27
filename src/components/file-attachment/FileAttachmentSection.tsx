import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, FileText, Image as ImageIcon, Eye, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadAttachment, deleteAttachment, getPreviewUrl } from '@/actions/attachments';

export type AttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  uploaded: boolean;
  uploading?: boolean;
  progress?: number;
  previewUrl?: string;
};

interface FileAttachmentSectionProps {
  onFilesChange: (files: AttachmentFile[]) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  initialFiles?: AttachmentFile[];
  disabled?: boolean;
}

const ALLOWED_TYPES = ['png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FileIcon = ({ fileName, className }: { fileName: string; className?: string }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return <FileText className={cn('h-10 w-10 text-red-500', className)} />;
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return <FileText className={cn('h-10 w-10 text-gray-500', className)} />;
  }
  if (['xls', 'xlsx'].includes(ext || '')) {
    return <FileText className={cn('h-10 w-10 text-green-500', className)} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) {
    return <ImageIcon className={cn('h-10 w-10 text-gray-500', className)} />;
  }
  return <FileText className={cn('h-10 w-10 text-gray-500', className)} />;
};

export function FileAttachmentSection({
  onFilesChange,
  maxFiles = 3,
  allowedTypes = ALLOWED_TYPES,
  initialFiles = [],
  disabled = false,
}: FileAttachmentSectionProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachmentFile[]>(initialFiles);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when initialFiles changes
  useEffect(() => {
    setAttachedFiles(initialFiles);
  }, [initialFiles]);

  const validateFile = useCallback(
    (file: File): boolean => {
      const ext = file.name.split('.').pop()?.toLowerCase();

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds 5MB limit`);
        return false;
      }

      // Check file type
      if (!ext || !allowedTypes.includes(ext)) {
        toast.error(`File type ".${ext}" not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        return false;
      }

      return true;
    },
    [allowedTypes]
  );

  const uploadFile = useCallback(async (file: File, tempId: string) => {
    try {
      const response = await uploadAttachment(file);
      if (response?.status === 200 || response?.data) {
        const attachment = response.data?.data || response.data;
        return {
          id: attachment._id || attachment.id,
          name: attachment.originalName || file.name,
          size: attachment.size || file.size,
          type: attachment.contentType || file.type,
          uploaded: true,
          uploading: false,
          progress: 100,
        };
      }
      throw new Error('Upload failed');
    } catch (error) {
      throw error;
    }
  }, []);

  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(validateFile);

      // Check max files limit
      if (attachedFiles.length + validFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check for duplicate file names
      const existingNames = attachedFiles.map((f) => f.name.toLowerCase());
      const duplicateFiles = validFiles.filter((file) =>
        existingNames.includes(file.name.toLowerCase())
      );

      if (duplicateFiles.length > 0) {
        toast.error(
          `File(s) with same name already exist: ${duplicateFiles.map((f) => f.name).join(', ')}`
        );
        return;
      }

      // Create temp file objects
      const newFiles: AttachmentFile[] = validFiles.map((file, index) => ({
        id: `temp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        uploaded: false,
        uploading: true,
        progress: 0,
      }));

      const updatedFiles = [...attachedFiles, ...newFiles];
      setAttachedFiles(updatedFiles);
      setIsUploading(true);

      // Upload files sequentially
      const uploadedFiles: AttachmentFile[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const tempFile = newFiles[i];
        try {
          const uploadedFile = await uploadFile(tempFile.file!, tempFile.id);
          uploadedFiles.push(uploadedFile);
          setAttachedFiles((prev) =>
            prev.map((f) => (f.id === tempFile.id ? uploadedFile : f))
          );
        } catch (error) {
          // Remove failed file
          setAttachedFiles((prev) => prev.filter((f) => f.id !== tempFile.id));
          toast.error(`Failed to upload "${tempFile.name}"`);
        }
      }

      setIsUploading(false);
      // Get final files after all uploads complete
      const finalFiles = [
        ...attachedFiles.filter((f) => f.uploaded && !f.id.startsWith('temp-')),
        ...uploadedFiles,
      ];
      setAttachedFiles(finalFiles);
      onFilesChange(finalFiles);
    },
    [attachedFiles, maxFiles, validateFile, uploadFile, onFilesChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (!disabled) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveFile = useCallback(
    async (fileId: string) => {
      const file = attachedFiles.find((f) => f.id === fileId);
      if (!file) return;

      // If file is uploaded, delete from server
      if (file.uploaded && !file.id.startsWith('temp-')) {
        try {
          await deleteAttachment(fileId);
        } catch (error) {
          // Continue with removal even if delete fails
          console.error('Error deleting attachment:', error);
        }
      }

      const updatedFiles = attachedFiles.filter((f) => f.id !== fileId);
      setAttachedFiles(updatedFiles);
      onFilesChange(updatedFiles);
    },
    [attachedFiles, onFilesChange]
  );

  const handlePreviewFile = async (file: AttachmentFile) => {
    if (file.uploaded && !file.id.startsWith('temp-')) {
      try {
        const response = await getPreviewUrl(file.id);
        if (response?.data?.data?.previewUrl) {
          setPreviewFile({ ...file, previewUrl: response.data.data.previewUrl });
        } else {
          setPreviewFile(file);
        }
      } catch (error) {
        console.error('Error fetching preview URL:', error);
        setPreviewFile(file);
      }
    } else {
      setPreviewFile(file);
    }
    setPreviewDialogOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const hasUploadingFiles = attachedFiles.some((f) => f.uploading);

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Attachments</CardTitle>
        <CardDescription>
          Add up to {maxFiles} files. Supported: {allowedTypes.join(', ')}. Max 5MB per file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled) {
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-sidebar-primary bg-sidebar-primary/5'
              : 'border-muted-foreground/25 hover:border-sidebar-primary hover:bg-sidebar-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-sidebar-primary" />
          <p className="text-sm font-medium mb-1">
            {hasUploadingFiles ? 'Uploading files...' : 'Drop files here or click to select'}
          </p>
          {hasUploadingFiles && (
            <p className="text-xs text-sidebar-primary mb-2">Please wait for all files to upload before proceeding</p>
          )}
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} files • Max 5MB per file
          </p>
          {hasUploadingFiles && (
            <div className="mt-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-sidebar-primary" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleInputChange}
          accept={allowedTypes.map((type) => `.${type}`).join(',')}
          disabled={disabled}
        />

        {/* Attached Files List */}
        {attachedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Attached Files ({attachedFiles.length}/{maxFiles})
              </p>
            </div>
            <div className="space-y-2">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    file.uploaded
                      ? 'bg-muted/50 border-border'
                      : 'bg-warning/10 border-warning',
                    file.uploading && 'opacity-75'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 flex-1 min-w-0',
                      file.uploaded && 'cursor-pointer'
                    )}
                    onClick={() => file.uploaded && handlePreviewFile(file)}
                  >
                    <FileIcon fileName={file.name} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          file.uploaded && 'hover:underline'
                        )}
                      >
                        {file.name}
                        {file.uploading && ' (uploading...)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                        {!file.uploaded && ' - Not uploaded yet'}
                      </p>
                      {file.uploading && file.progress !== undefined && (
                        <Progress value={file.progress} className="mt-1 h-1" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {file.uploaded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewFile(file);
                        }}
                        title="Preview file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={file.uploading}
                      title="Delete file"
                    >
                      {file.uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* File Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogDescription>File preview</DialogDescription>
          </DialogHeader>
          <div className="mt-4 min-h-[400px] flex items-center justify-center">
            {previewFile?.file ? (
              // Local file preview
              previewFile?.type?.includes('image') ? (
                <img
                  src={URL.createObjectURL(previewFile.file)}
                  alt={previewFile.name}
                  className="max-w-full max-h-[500px] object-contain"
                />
              ) : previewFile?.type === 'application/pdf' ||
                previewFile?.name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={URL.createObjectURL(previewFile.file)}
                  className="w-full h-[500px] border-0"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center">
                  <FileIcon fileName={previewFile.name} />
                  <p className="text-sm mt-2">Preview not available for this file type</p>
                  <p className="text-xs text-muted-foreground">
                    {previewFile.name} ({formatFileSize(previewFile.size)})
                  </p>
                </div>
              )
            ) : previewFile?.uploaded && previewFile.previewUrl ? (
              // Server file preview with signed URL
              (() => {
                const ext = previewFile?.name?.split('.').pop()?.toLowerCase();
                const isImage = ['png', 'jpg', 'jpeg'].includes(ext || '');
                const isPdf = ext === 'pdf';

                if (isImage) {
                  return (
                    <img
                      src={previewFile.previewUrl}
                      alt={previewFile.name}
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  );
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={previewFile.previewUrl}
                      className="w-full h-[500px] border-0"
                      title={previewFile.name}
                    />
                  );
                }

                return (
                  <div className="text-center">
                    <FileIcon fileName={previewFile.name} />
                    <p className="text-sm mt-2">Preview not available for this file type</p>
                    <p className="text-xs text-muted-foreground">
                      {previewFile.name} ({formatFileSize(previewFile.size || 0)})
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="text-center">
                <FileIcon fileName={previewFile?.name || ''} />
                <p className="text-sm mt-2">Preview not available for this file type</p>
                <p className="text-xs text-muted-foreground">
                  {previewFile?.name} ({formatFileSize(previewFile?.size || 0)})
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
