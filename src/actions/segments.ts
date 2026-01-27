import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from '@/lib/api';
import { toast } from 'sonner';
import type { Segment, SegmentFilter } from '@/types/segment';

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// Get all segments (SWR hook)
export function getAllSegments() {
  const url = `${endpoints.segments?.allSegments || '/segments/all'}`;

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

// Get paginated segments
export async function getPaginatedSegments(params?: string) {
  try {
    let url = `${endpoints.segments?.segments || '/segments'}`;
    if (params) {
      url += params;
    }
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    console.error('Error fetching paginated segments:', error);
    toast.error(error?.message || 'Failed to fetch segments');
    return null;
  }
}

// Get segment by ID
export async function getSegmentById(id: string) {
  try {
    const url = `${endpoints.segments?.segments || '/segments'}/${id}`;
    const res = await axios.get(url);
    return res;
  } catch (error: any) {
    console.error('Error fetching segment:', error);
    toast.error(error?.message || 'Failed to fetch segment');
    throw error;
  }
}

// Create segment
export async function createSegment(params: { name: string; filters: SegmentFilter[] }) {
  try {
    const response = await axios.post(endpoints.segments?.segments || '/segments', params);
    if (response?.status === 200 || response?.status === 201) {
      toast.success('Segment created successfully');
      await mutate(endpoints.segments?.allSegments || '/segments/all');
    }
    return response;
  } catch (error: any) {
    console.error('Error creating segment:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to create segment');
    throw error;
  }
}

// Update segment
export async function updateSegment(id: string, params: { name: string; filters: SegmentFilter[] }) {
  try {
    const response = await axios.patch(
      `${endpoints.segments?.segments || '/segments'}/${id}`,
      params
    );
    if (response?.status === 200) {
      toast.success('Segment updated successfully');
      await mutate(endpoints.segments?.allSegments || '/segments/all');
    }
    return response;
  } catch (error: any) {
    console.error('Error updating segment:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to update segment');
    throw error;
  }
}

// Delete segment
export async function deleteSegment(id: string) {
  try {
    const url = `${endpoints.segments?.segments || '/segments'}/${id}`;
    const res = await axios.delete(url);
    if (res?.status === 200) {
      toast.success('Segment deleted successfully');
      await mutate(endpoints.segments?.allSegments || '/segments/all');
    }
    return res;
  } catch (error: any) {
    console.error('Error deleting segment:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to delete segment');
    throw error;
  }
}

// Duplicate segment
export async function duplicateSegment(id: string) {
  try {
    const url = `${endpoints.segments?.segments || '/segments'}/${id}/clone`;
    const res = await axios.post(url);
    if (res?.status === 200) {
      toast.success('Segment duplicated successfully');
      await mutate(endpoints.segments?.allSegments || '/segments/all');
    }
    return res;
  } catch (error: any) {
    console.error('Error duplicating segment:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to duplicate segment');
    throw error;
  }
}

// Get segment filter count
export async function getSegmentFilterCount(segmentId: string) {
  try {
    const response = await axios.get(
      `${endpoints.segments?.segments || '/segments'}/${segmentId}/filter-count`
    );
    return response;
  } catch (error: any) {
    console.error('Error fetching segment filter count:', error);
    toast.error(error?.message || 'Failed to fetch segment count');
    return null;
  }
}

// Get segment contacts
export async function getSegmentContacts(segmentIds: string[], pageNumber = 1, pageSize = 10) {
  try {
    const response = await axios.post('/company-contacts/get-segment-contacts', {
      segmentIds,
      pageNumber,
      pageSize,
    });
    return response;
  } catch (error: any) {
    console.error('Error fetching segment contacts:', error);
    toast.error(error?.message || 'Failed to fetch segment contacts');
    return null;
  }
}

// Get user count for filters (used in segment builder)
export async function getUserCount(
  fieldType: string | null,
  values: Array<string | number>,
  condition: any[] | null,
  operator: 'AND' | 'OR' | null,
  selectedGroups: SegmentFilter[],
  fieldId?: string
) {
  try {
    let filterObject: any = null;
    if (fieldType) {
      filterObject = {
        key: fieldType,
        values: Array.isArray(values) ? values : [values],
        fieldId: fieldId,
      };
    }

    if (condition) {
      filterObject = filterObject || {};
      filterObject.conditions = condition;
    }

    if (operator) {
      filterObject = filterObject || {};
      filterObject.operator = operator;
    }

    const filters = filterObject ? [filterObject] : [];

    if (selectedGroups && selectedGroups.length > 0) {
      selectedGroups.forEach((group) => {
        const groupFilter: any = {
          key: group.key || group.fieldType,
          values: group.values?.[0]?.conditions
            ? []
            : Array.isArray(group.values)
              ? group.values
              : [group.values],
          fieldId: group.fieldId,
        };

        if (group.conditions) {
          groupFilter.conditions = group.conditions;
        }

        if (group.operator) {
          groupFilter.operator = group.operator;
        }

        filters.push(groupFilter);
      });
    }

    const response = await axios.post('/company-contacts/get-filter-count', {
      filters: filters,
    });

    const segmentCountObj = response.data?.data?.find(
      (item: any) => item.filterKey === 'segmentCount'
    );

    const segmentCount = segmentCountObj ? segmentCountObj.filterCount : 0;
    const segmentInvalidEmailCount = segmentCountObj ? segmentCountObj.totalInvalidEmailCount : 0;
    const segmentUnSubscribedUserCount = segmentCountObj
      ? segmentCountObj.totalUnSubscribedCount
      : 0;

    return {
      count: response.data?.data?.[0]?.filterCount || 0,
      invalidEmailCount: response.data?.data?.[0]?.invalidEmailCount || 0,
      fieldValues: response.data?.data?.[0]?.filterValues || [],
      unSubscribedUserCount: response.data?.data?.[0]?.unSubscribedUserCount || 0,
      segement: {
        segmentCount: segmentCount,
        segmentInvalidEmailCount: segmentInvalidEmailCount,
        segmentUnSubscribedUserCount: segmentUnSubscribedUserCount,
      },
      segmentCount: segmentCount,
      segmentInvalidEmailCount: segmentInvalidEmailCount,
      segmentUnSubscribedUserCount: segmentUnSubscribedUserCount,
    };
  } catch (error: any) {
    console.error('Error fetching user count:', error);
    toast.error('Failed to fetch user count');
    return null;
  }
}
