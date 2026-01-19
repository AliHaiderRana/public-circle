import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios from '@/lib/api';
import { toast } from 'sonner';

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

export function getAllRoles() {
  const url = `/roles/all`;

  const { data, isLoading } = useSWR(url, (url) => axios.get(url).then((res) => res.data), swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allRoles: data?.data || [],
      isLoading,
      mutate: () => mutate(url),
    }),
    [data, isLoading, url]
  );

  return memoizedValue;
}

export function getAllRolesUsers() {
  const url = `/users/all`;

  const { data, isLoading } = useSWR(url, (url) => axios.get(url).then((res) => res.data), swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allRolesUsers: data?.data || [],
      isLoading,
      mutate: () => mutate(url),
    }),
    [data, isLoading, url]
  );

  return memoizedValue;
}

export async function createRole(params: { name: string; emailAddress: string; roleId: string }) {
  try {
    const url = '/users';
    const res = await axios.post(url, params);
    toast.success(res?.data?.message || 'User invitation sent successfully');
    return res.data;
  } catch (error: any) {
    console.error('Error creating role/user:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to invite user');
    return null;
  }
}

export async function deleteRoleUser(id: string) {
  try {
    const url = `/users/${id}`;
    const res = await axios.delete(url);
    toast.success(res?.data?.message || 'User deleted successfully');
    return res.data;
  } catch (error: any) {
    console.error('Error deleting user:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to delete user');
    return null;
  }
}

export async function resendInvite(params: { emailAddress: string }) {
  try {
    const url = '/auth/send-invitation-email';
    const res = await axios.post(url, params);
    toast.success(res?.data?.message || 'Invitation email sent successfully');
    return res.data;
  } catch (error: any) {
    console.error('Error resending invite:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to resend invitation');
    return null;
  }
}

export async function deleteRole(id: string) {
  try {
    const response = await axios.delete(`/roles/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error deleting role:', error);
    toast.error(error?.message);
    throw error;
  }
}
