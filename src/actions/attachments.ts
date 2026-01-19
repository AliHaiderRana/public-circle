import axios from '@/lib/api';
import { toast } from 'sonner';

export async function uploadAttachment(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    toast.error(error?.response?.data?.message || 'Failed to upload attachment');
    throw error;
  }
}

export async function deleteAttachment(attachmentId: string) {
  try {
    const response = await axios.delete(`/attachments/${attachmentId}`);
    return response;
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    // Don't show error toast for 404 (already deleted)
    if (error?.response?.status !== 404) {
      toast.error(error?.response?.data?.message || 'Failed to delete attachment');
    }
    throw error;
  }
}

export async function getAttachment(attachmentId: string) {
  try {
    const response = await axios.get(`/attachments/${attachmentId}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching attachment:', error);
    toast.error(error?.response?.data?.message || 'Failed to fetch attachment');
    throw error;
  }
}

export async function getPreviewUrl(attachmentId: string) {
  try {
    const response = await axios.get(`/attachments/${attachmentId}/preview-url`);
    return response;
  } catch (error: any) {
    console.error('Error fetching preview URL:', error);
    toast.error(error?.response?.data?.message || 'Failed to get preview URL');
    throw error;
  }
}
