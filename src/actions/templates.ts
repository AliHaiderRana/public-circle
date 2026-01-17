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

export async function getPaginatedTemplates(params?: string) {
  try {
    let url = `/templates`;
    if (params) {
      url += `${params}`;
    }
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
}

export async function getTemplateById(id: string) {
  try {
    const response = await axios.get(`/templates/${id}`);
    return response;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
}

export function getAllTemplates() {
  const url = `${endpoints.templates.allTemplates}`;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      tempTemplates: Array.isArray(data?.data) ? data.data : [],
      templatesLoading: !data,
      revalidateTemplates: () => mutate(url),
    }),
    [data, url]
  );

  return memoizedValue;
}

export function getAllSampleTemplates() {
  const url = `${endpoints.templates.allSampleTemplates}`;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allSampleTemplates: data?.data || [],
      isLoading: !data,
      revalidateTemplates: () => mutate(url),
    }),
    [data]
  );

  return memoizedValue;
}

export async function createTemplate(params: any) {
  try {
    const response = await axios.post(endpoints.templates.templates, params);
    return response;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
}

export async function updateTemplate(id: string, params: any) {
  try {
    const response = await axios.patch(`${endpoints.templates.templates}/${id}`, params);
    return response;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
}

export async function deleteTemplate(id: string) {
  try {
    const response = await axios.delete(`${endpoints.templates.templates}/${id}`);
    return response;
  } catch (error: any) {
    toast.error(error?.message);
    return null;
  }
}

export async function duplicateTemplate(id: string) {
  try {
    const response = await axios.post('/templates/duplicate', { templateId: id });
    return response;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Failed to duplicate template');
    return null;
  }
}

export async function createTemplateSaveAs(templateId: string, params: any) {
  try {
    const response = await axios.post(`/templates/duplicate/${templateId}`, params);
    return response;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Failed to save template as new');
    return null;
  }
}

export function getAllTemplateGroups() {
  const url = `/company-grouping?type=TEMPLATE`;

  const { data, error } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(
    () => ({
      allGroups: error && (error as any).status === 404 ? [] : data?.data || [],
      isLoading: !data && !error,
    }),
    [data, error]
  );

  return memoizedValue;
}
