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

export async function uploadCSV(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(endpoints.user.uploadCSV, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Error uploading CSV:', error);
    toast.error(error?.message);
    return null;
  }
}
