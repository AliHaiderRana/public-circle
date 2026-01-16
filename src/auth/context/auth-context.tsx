import { createContext } from 'react';

// ----------------------------------------------------------------------

export const AuthContext = createContext<{
  user: any;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  signupUser: any;
  checkUserSession: () => Promise<void>;
  updateSignupUser: (data: any) => void;
} | undefined>(undefined);

export const AuthConsumer = AuthContext.Consumer;
