import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher } from '@/lib/api';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

export function getAllAssets() {
  const url = '/assets/all';

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allAssets: data?.data || [],
      isLoading: !data,
      revalidateAssets: () => mutate(url),
    }),
    [data, url]
  );

  return memoizedValue;
}

export async function getSignedUrl(params: { fileName: string }) {
  try {
    const response = await axios.post('/assets/file-upload-url', params);
    return response;
  } catch (error: any) {
    console.error('Error getting signed URL:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to get upload URL');
    return null;
  }
}

export async function getCompanyAsset(assetId: string) {
  try {
    const response = await axios.get(`/assets/${assetId}`);
    return response;
  } catch (error: any) {
    console.error('Error getting asset:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to get asset');
    return null;
  }
}

export async function uploadToS3(file: File, signedUrl: string): Promise<boolean> {
  try {
    const fileBinary = await file.arrayBuffer();
    
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: fileBinary,
    });

    if (response.ok) {
      return true;
    } else {
      console.error('Upload failed', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error uploading file', error);
    return false;
  }
}
