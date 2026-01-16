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

export async function deleteSegment(id: string) {
  const url = `${endpoints.segments.segments}/${id}`;
  const res = await axios.delete(url);
  return res;
}

export function getAllSegments() {
  const url = `${endpoints.segments.allSegments}`;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allSegments: data?.data || [],
      isLoading: !data,
    }),
    [data]
  );

  return memoizedValue;
}

export async function getPaignatedSegments(params?: string) {
  try {
    let url = `/segments`;
    if (params) {
      url += `/${params}`;
    }
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    console.error('Error fetching segments:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function createSegment(params: any) {
  try {
    const response = await axios.post(endpoints.segments.segments, params);
    return response;
  } catch (error: any) {
    console.error('Error creating segment:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function updateSegment(id: string, params: any) {
  try {
    const response = await axios.patch(`${endpoints.segments.segments}/${id}`, params);
    return response;
  } catch (error: any) {
    console.error('Error updating segment:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getSegmentById(id: string) {
  try {
    const response = await axios.get(`${endpoints.segments.segments}/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching segment:', error);
    toast.error(error?.message);
    return null;
  }
}
