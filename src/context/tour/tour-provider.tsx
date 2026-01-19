import { useState, useMemo, ReactNode } from 'react';
import { TourContext, type TourContextValue } from './tour-context';

// ----------------------------------------------------------------------

const initialTourState: Omit<TourContextValue, 'setState'> = {
  run: false,
  steps: [],
  tourActive: false,
  isSkip: false,
  progress: 0,
  isMarkingDuplicates: false,
  isSubscriptionCancelled: false,
  subscriptionEndDate: null,
  activeSignupStep: 0,
};

// ----------------------------------------------------------------------

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [state, setState] = useState(initialTourState);

  const updateState = (newState: Partial<TourContextValue>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const value = useMemo(
    () => ({
      ...state,
      setState: updateState,
    }),
    [state]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
