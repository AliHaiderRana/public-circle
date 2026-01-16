import { useMemo, useEffect, useCallback, useState } from 'react';
import axios, { endpoints } from '@/lib/api';
import { REGION_KEY, STORAGE_KEY } from '@/config/config';
import { setSession, isValidToken } from '../utils/jwt';
import { paths } from '@/routes/paths';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from './auth-context';

// SESSION TIMEOUT CONFIG - 4 hours
const SESSION_TIMEOUT = 4 * 60 * 60 * 1000;
const SESSION_LAST_ACTIVITY_KEY = 'session_last_activity';

// Check if session has expired
const hasSessionExpired = () => {
  const lastActivity = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
  if (!lastActivity) {
    return false;
  }

  const lastActivityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;

  return timeSinceLastActivity > SESSION_TIMEOUT;
};

// Update last activity timestamp
const updateLastActivity = () => {
  localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, Date.now().toString());
};

// Schedule next session check based on remaining time
let sessionCheckTimeoutId: NodeJS.Timeout | null = null;

const scheduleSessionCheck = () => {
  if (sessionCheckTimeoutId) {
    clearTimeout(sessionCheckTimeoutId);
  }

  const lastActivity = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
  if (!lastActivity) {
    return;
  }

  const lastActivityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;
  const remainingTime = SESSION_TIMEOUT - timeSinceLastActivity;

  if (remainingTime > 0) {
    sessionCheckTimeoutId = setTimeout(() => {
      if (hasSessionExpired() && document.hasFocus()) {
        updateLastActivity();
        window.location.reload();
      } else if (hasSessionExpired() && !document.hasFocus()) {
        // Wait for user to focus the tab
      } else {
        updateLastActivity();
        scheduleSessionCheck();
      }
    }, remainingTime + 100);
  }
};

// ----------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    user: null as any,
    loading: true,
    signupUser: null as any,
    region: null as string | null,
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const region = searchParams.get('region');

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEY);
      if (region) {
        localStorage.setItem(REGION_KEY, region);
      }
      
      // No token - user is not authenticated
      if (!accessToken) {
        setState({ user: null, loading: false, signupUser: null, region });
        return;
      }

      // Has token - validate it
      setSession(accessToken);

      try {
        const res = await axios.get(endpoints.auth.me);
        const tempUser = res?.data?.data;
        if (tempUser?.company?.status == 'SUSPENDED') {
          setState({ user: null, loading: false, signupUser: null, region });
        } else if (tempUser && tempUser?.signUpStepsCompleted == 8) {
          setState({
            user: { ...res.data?.data, accessToken },
            loading: false,
            signupUser: null,
            region,
          });
          updateLastActivity();
        } else {
          setState({
            user: null,
            loading: false,
            signupUser: { ...res.data?.data },
            region,
          });
          updateLastActivity();
          navigate(
            `${paths.auth.jwt.signUp}?step=${
              tempUser?.signUpStepsCompleted === 7
                ? tempUser?.signUpStepsCompleted
                : tempUser?.signUpStepsCompleted + 1
            }&emailAddress=${tempUser?.emailAddress}`
          );
        }
      } catch (apiError) {
        // If API call fails (e.g., server not running, invalid token), clear token and set unauthenticated
        console.error('Auth check failed:', apiError);
        localStorage.removeItem(STORAGE_KEY);
        setState({ user: null, loading: false, signupUser: null, region });
      }
    } catch (error) {
      console.error('Auth session check error:', error);
      setState({ user: null, loading: false, signupUser: null, region });
    }
  }, [navigate, region]);

  const updateSignupUser = useCallback(
    (data: any) => {
      setState((prev) => ({
        ...prev,
        signupUser: {
          ...prev.signupUser,
          company: {
            ...(prev.signupUser?.company || {}),
            ...data,
          },
        },
      }));
    },
    []
  );

  useEffect(() => {
    checkUserSession();

    if (!localStorage.getItem(SESSION_LAST_ACTIVITY_KEY)) {
      updateLastActivity();
    }

    scheduleSessionCheck();

    return () => {
      if (sessionCheckTimeoutId) {
        clearTimeout(sessionCheckTimeoutId);
      }
    };
  }, [checkUserSession]);

  // Set up activity tracking
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
      scheduleSessionCheck();
    };

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const handleWindowFocus = () => {
      try {
        if (hasSessionExpired()) {
          updateLastActivity();
          window.location.reload();
          return;
        }
        updateLastActivity();
        scheduleSessionCheck();
      } catch (err) {
        console.error('Error handling focus:', err);
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            role: state.user?.role ?? 'Admin',
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      signupUser: state?.signupUser ? state?.signupUser : null,
      updateSignupUser,
    }),
    [checkUserSession, state.user, status, state.signupUser, updateSignupUser]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
