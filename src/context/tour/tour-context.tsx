import { createContext, useContext } from 'react';

// ----------------------------------------------------------------------

export interface TourContextValue {
  run: boolean;
  steps: any[];
  tourActive: boolean;
  isSkip: boolean;
  progress: number;
  isMarkingDuplicates: boolean;
  isSubscriptionCancelled: boolean;
  subscriptionEndDate: Date | null;
  activeSignupStep: number;
  setState: (state: Partial<TourContextValue>) => void;
}

// ----------------------------------------------------------------------

export const TourContext = createContext<TourContextValue | undefined>(undefined);

// ----------------------------------------------------------------------

export function useTourContext() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
}
