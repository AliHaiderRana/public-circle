import axios from '@/lib/api';
import { STORAGE_KEY } from '@/config/config';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string | null): boolean {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

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

export function tokenExpired(exp: number) {
  const FIFTEEN_MINUTES = 15 * 30 * 1000; // 15 minutes in milliseconds

  const intervalId = setInterval(async () => {
    try {
      const res = await getToken();
      if (res?.status === 200) {
        const newToken = res?.data?.data?.token;

        if (newToken) {
          localStorage.setItem(STORAGE_KEY, newToken);
          axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        }
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
    }
  }, FIFTEEN_MINUTES);

  return intervalId;
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null) {
  try {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEY, accessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
