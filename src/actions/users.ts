import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from '@/lib/api';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

export function getAllUsers(page = 1, pageSize = 10) {
  const url = `${endpoints.user.getAllUsers}&pageNumber=${page}&pageSize=${pageSize}`;

  const { data, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allUsers: data?.data?.allContacts,
      totalCount: data?.data?.totalRecords,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
}

export async function uploadCSV(
  file: File,
  onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(endpoints.user.uploadCSV, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            if (progressEvent.total) {
              onUploadProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
              });
            }
          }
        : undefined,
    });
    return response;
  } catch (error: any) {
    console.error('Error uploading CSV:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to upload CSV');
    return null;
  }
}

// ----------------------------------------------------------------------
// Tour Management Functions
// ----------------------------------------------------------------------

export async function skipTour() {
  try {
    const response = await axios.post(endpoints.user.skipTour);
    return response.data;
  } catch (error: any) {
    console.error('Error skipping tour:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to skip tour');
    throw error;
  }
}

export async function completeTour() {
  try {
    const response = await axios.post(endpoints.user.completeTour);
    return response.data;
  } catch (error: any) {
    console.error('Error completing tour:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to complete tour');
    throw error;
  }
}

export async function resetTour() {
  try {
    const response = await axios.post(endpoints.user.resetTour);
    return response.data;
  } catch (error: any) {
    console.error('Error resetting tour:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to reset tour');
    throw error;
  }
}
