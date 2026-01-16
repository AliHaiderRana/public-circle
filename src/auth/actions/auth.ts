import axios, { endpoints } from '@/lib/api';
import { setSession } from '../utils/jwt';
import { STORAGE_KEY } from '@/config/config';

// ----------------------------------------------------------------------

export const signInWithPassword = async ({
  emailAddress,
  password,
}: {
  emailAddress: string;
  password: string;
}) => {
  try {
    const params = { emailAddress, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { token, user } = res.data.data;

    if (!token) {
      throw new Error('Access token not found in response');
    }

    setSession(token);

    // Return user data to check for suspended status
    return { token, user };
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export async function getToken() {
  try {
    const url = `/auth/token`;
    const response = await axios.get(url);
    return response;
  } catch (error) {
    return null;
  }
}

// ----------------------------------------------------------------------

export const signUp = async ({
  emailAddress,
  password,
  firstName,
  lastName,
  company,
}: {
  emailAddress: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}) => {
  const params = {
    emailAddress,
    password,
    firstName,
    lastName,
    company: {
      name: company,
    },
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { token } = res.data.data;

    if (!token) {
      throw new Error('Access token not found in response');
    }

    localStorage.setItem(STORAGE_KEY, token);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const signOut = async () => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const forgotPassword = async (params: { emailOrPhoneNumber?: string; emailAddress?: string }) => {
  const url = '/auth/forgot-password';
  const res = await axios.post(url, params);
  return res.data;
};
