import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ArrowLeft } from 'lucide-react';
import axios from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { Progress } from '@/components/ui/progress';

export default function ContactsImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('csvFile', file);
      
      await axios.post('/company-contacts/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Contacts uploaded successfully');
      setFile(null);
      
      // Navigate to contacts list after successful upload
      setTimeout(() => {
        navigate(paths.dashboard.contacts.list);
      }, 1000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload contacts');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Contacts</h1>
            <p className="text-muted-foreground mt-1">
              Upload a CSV file to import contacts into the system
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(paths.dashboard.contacts.list)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Select a CSV file containing your contacts. Maximum file size: 10MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Selected: {file.name}</span>
                <span className="text-xs">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">CSV Format Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>First row should contain column headers</li>
              <li>Required columns: email</li>
              <li>Optional columns: firstName, lastName, phoneNumber, and any custom fields</li>
              <li>Maximum file size: 10MB</li>
              <li>File encoding: UTF-8</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
