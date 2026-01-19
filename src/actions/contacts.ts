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

// ----------------------------------------------------------------------
// Contact Management

export interface Contact {
  _id: string;
  [key: string]: any;
}

export interface PaginatedContactsResponse {
  data: Contact[];
  total: number;
}

export interface ContactFilter {
  id: string;
  filterKey: string | null;
  filterValues: string[];
  valuesData: string[];
  filterValuesPage?: number;
  hasMore?: boolean;
  searchTerm?: string;
  isFilterLoading?: boolean;
}

export async function getPaginatedContacts(
  page: number,
  pageSize: number,
  filters: ContactFilter[] = [],
  options: {
    isUnSubscribed?: boolean;
    isInvalidEmail?: boolean;
    isPrivateRelayEmail?: boolean;
    unSubscribedReason?: string;
  } = {}
): Promise<PaginatedContactsResponse> {
  try {
    const formattedFilters = filters
      .filter((filter) => filter.filterKey !== null && filter.filterKey !== '')
      .map((filter) => ({
        filterKey: filter.filterKey!,
        filterValues: filter.filterValues || [],
      }));

    const response = await axios.post('/company-contacts/get-paginated-contacts', {
      pageNumber: page + 1, // API uses 1-based pagination
      pageSize,
      filters: formattedFilters,
      isUnSubscribed: options.isUnSubscribed || false,
      isInvalidEmail: options.isInvalidEmail || false,
      isPrivateRelayEmail: options.isPrivateRelayEmail || false,
      ...(options.unSubscribedReason && { unSubscribedReason: options.unSubscribedReason }),
    });

    return {
      data: response.data?.data?.companyContacts || [],
      total: response.data?.data?.totalRecords || 0,
    };
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    toast.error(error?.message || 'Failed to fetch contacts');
    return { data: [], total: 0 };
  }
}

export async function updateContact(id: string, params: any) {
  try {
    const response = await axios.patch(`/company-contacts/${id}`, params);
    toast.success('Contact updated successfully');
    return response;
  } catch (error: any) {
    console.error('Error updating contact:', error);
    toast.error(error?.message || 'Failed to update contact');
    throw error;
  }
}

export async function deleteContact(id: string) {
  try {
    const response = await axios.delete(`/company-contacts/${id}`);
    toast.success('Contact deleted successfully');
    return response;
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    toast.error(error?.message || 'Failed to delete contact');
    throw error;
  }
}

export async function deleteContacts(ids: string[]) {
  try {
    const response = await axios.post('/company-contacts/delete-multiple', { ids });
    toast.success(`${ids.length} contact(s) deleted successfully`);
    return response;
  } catch (error: any) {
    console.error('Error deleting contacts:', error);
    toast.error(error?.message || 'Failed to delete contacts');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Primary Key Management

export function getPrimaryKey() {
  const url = '/company-contacts/primary-key';
  const { data, isLoading, mutate: mutateKey } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      primaryKey: data?.data?.primaryKey || null,
      isLoading,
      mutateKey,
    }),
    [data, isLoading, mutateKey]
  );

  return memoizedValue;
}

export async function createPrimaryKey(primaryKey: string) {
  try {
    const response = await axios.post('/company-contacts/primary-key', {
      primaryKey: primaryKey === 'company' ? 'companyId' : primaryKey,
    });
    toast.success('Primary key created successfully');
    await mutate('/company-contacts/primary-key');
    return response;
  } catch (error: any) {
    console.error('Error creating primary key:', error);
    toast.error(error?.message || 'Failed to create primary key');
    throw error;
  }
}

export async function updatePrimaryKey(primaryKey: string) {
  try {
    const response = await axios.patch('/company-contacts/primary-key', {
      primaryKey: primaryKey === 'company' ? 'companyId' : primaryKey,
    });
    toast.success('Primary key updated successfully');
    await mutate('/company-contacts/primary-key');
    return response;
  } catch (error: any) {
    console.error('Error updating primary key:', error);
    toast.error(error?.message || 'Failed to update primary key');
    throw error;
  }
}

export async function deletePrimaryKey() {
  try {
    const response = await axios.delete('/company-contacts/primary-key');
    toast.success('Primary key deleted successfully');
    await mutate('/company-contacts/primary-key');
    return response;
  } catch (error: any) {
    console.error('Error deleting primary key:', error);
    toast.error(error?.message || 'Failed to delete primary key');
    throw error;
  }
}

export async function getPrimaryKeyEffect(primaryKey: string) {
  try {
    const response = await axios.get(
      `/company-contacts/primary-key-effect?primaryKey=${primaryKey === 'company' ? 'companyId' : primaryKey}`
    );
    return response;
  } catch (error: any) {
    console.error('Error getting primary key effect:', error);
    return null;
  }
}

// ----------------------------------------------------------------------
// Email Key Management

export async function updateEmailKey(emailKey: string) {
  try {
    const response = await axios.patch('/users', { emailKey });
    toast.success('Email key updated successfully');
    return response;
  } catch (error: any) {
    console.error('Error updating email key:', error);
    toast.error(error?.message || 'Failed to update email key');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Statistics & Counts

export function getInvalidEmailCount() {
  const url = '/company-contacts/invalid-emails';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      InvalidEmailCount: data?.data?.invalidEmailCount || 0,
      DuplicatedCount: data?.data?.duplicatedCount || 0,
    }),
    [data]
  );

  return memoizedValue;
}

export function getUnSubscribedEmailCount() {
  const url = '/company-contacts/unsubscribed-emails';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      UnSubscribedEmailCount: data?.data?.unSubscribedEmailCount || 0,
    }),
    [data]
  );

  return memoizedValue;
}

export function getApplePrivateContactsCount() {
  const url = '/company-contacts/apple-private-contacts';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      ApplePrivateContactsCount: data?.data?.applePrivateContactsCount || 0,
    }),
    [data]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Duplicate Management

export interface DuplicateContact {
  old: Contact;
  new: Contact;
}

export interface DuplicateContactsResponse {
  duplicateContacts: DuplicateContact[];
  totalRecords: number;
}

export async function getDuplicateContacts(page: number = 1): Promise<DuplicateContactsResponse | null> {
  try {
    const response = await axios.get(`/company-contacts/duplicate-contacts?page=${page}`);
    return {
      duplicateContacts: response.data?.data?.duplicateContacts || [],
      totalRecords: response.data?.data?.totalRecords || 0,
    };
  } catch (error: any) {
    console.error('Error fetching duplicate contacts:', error);
    return null;
  }
}

export async function resolveDuplicates(params: {
  contactsToBeSaved?: Contact[];
  isSaveNewContact?: boolean;
}) {
  try {
    const response = await axios.post('/company-contacts/resolve-duplicates', params);
    toast.success(response?.data?.message || 'Duplicates resolved successfully');
    return response;
  } catch (error: any) {
    console.error('Error resolving duplicates:', error);
    toast.error(error?.message || 'Failed to resolve duplicates');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Revert Requests

export function getPrimaryKeyRevertRequests() {
  const url = '/company-contacts/customer-requests?type=EDIT_CONTACTS_PRIMARY_KEY';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      primaryKeyRequest: data?.data || null,
    }),
    [data]
  );

  return memoizedValue;
}

export function getEmailKeyRevertRequests() {
  const url = '/company-contacts/customer-requests?type=EDIT_CONTACTS_EMAIL_KEY';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      emailKeyRequest: data?.data || null,
    }),
    [data]
  );

  return memoizedValue;
}

export function getFiltersRevertRequests() {
  const url = '/company-contacts/customer-requests?type=EDIT_CONTACTS_FILTERS';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      filtersRequest: data?.data || null,
    }),
    [data]
  );

  return memoizedValue;
}

export async function revertContactsFinalize(type: string) {
  try {
    const response = await axios.post('/company-contacts/revert-finalize', { type });
    await mutate(`/company-contacts/customer-requests?type=${type}`);
    return response;
  } catch (error: any) {
    console.error('Error reverting finalization:', error);
    throw error;
  }
}

export async function cancelRevertContactsFinalize(type: string) {
  try {
    const response = await axios.post('/company-contacts/cancel-revert', { type });
    await mutate(`/company-contacts/customer-requests?type=${type}`);
    return response;
  } catch (error: any) {
    console.error('Error canceling revert:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Selection Criteria

export async function getSelectionCriteriaEffect(params: { 
  contactSelectionCriteria: Array<{ filterKey: string; filterValues: string[] }> 
}) {
  try {
    const response = await axios.post('/company-contacts/selection-criteria-effect', params);
    return response;
  } catch (error: any) {
    console.error('Error getting selection criteria effect:', error);
    return null;
  }
}

export async function finalizeContacts() {
  try {
    const response = await axios.post('/company-contacts/finalize-contact', {});
    toast.success(response?.data?.message || 'Contacts finalized successfully');
    await mutate('/company-contacts/customer-requests?type=EDIT_CONTACTS_PRIMARY_KEY');
    await mutate('/company-contacts/customer-requests?type=EDIT_CONTACTS_EMAIL_KEY');
    await mutate('/company-contacts/customer-requests?type=EDIT_CONTACTS_FILTERS');
    return response;
  } catch (error: any) {
    console.error('Error finalizing contacts:', error);
    toast.error(error?.message || 'Failed to finalize contacts');
    throw error;
  }
}

// ----------------------------------------------------------------------
// Filter Values

export function getFilterKeys() {
  const url = '/company-contacts/possible-filter-keys/';
  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      filterKeys: data?.data || [],
    }),
    [data]
  );

  return memoizedValue;
}

export async function getContactFilterValues(key: string, searchTerm: string = '', page: number = 1) {
  try {
    const params = new URLSearchParams({
      key,
      page: page.toString(),
      ...(searchTerm && { searchTerm }),
    });
    const response = await axios.get(`/company-contacts/contact-values?${params.toString()}`);
    return {
      values: response.data?.data?.values || [],
      hasMore: response.data?.data?.hasMore || false,
      total: response.data?.data?.total || 0,
    };
  } catch (error: any) {
    console.error('Error fetching filter values:', error);
    return { values: [], hasMore: false, total: 0 };
  }
}
