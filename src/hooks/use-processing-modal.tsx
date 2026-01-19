import { useState, useCallback } from 'react';

type ProcessingStatus = 'processing' | 'success' | 'error';

interface UseProcessingModalReturn {
  isProcessing: boolean;
  progress: number | null;
  title: string;
  message: string;
  isIndeterminate: boolean;
  status: ProcessingStatus;
  showProcessingModal: (
    title: string,
    message?: string,
    indeterminate?: boolean
  ) => void;
  updateProcessingProgress: (progress: number) => void;
  setStatus: (status: ProcessingStatus) => void;
  hideProcessingModal: () => void;
}

export function useProcessingModal(): UseProcessingModalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [status, setStatusState] = useState<ProcessingStatus>('processing');

  const showProcessingModal = useCallback(
    (modalTitle: string, modalMessage?: string, indeterminate = false) => {
      setTitle(modalTitle);
      setMessage(modalMessage || '');
      setIsIndeterminate(indeterminate);
      setStatusState('processing');
      setIsProcessing(true);
      if (!indeterminate) {
        setProgress(0);
      }
    },
    []
  );

  const updateProcessingProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    if (newProgress >= 100) {
      setStatusState('success');
    }
  }, []);

  const setStatus = useCallback((newStatus: ProcessingStatus) => {
    setStatusState(newStatus);
  }, []);

  const hideProcessingModal = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setTitle('');
    setMessage('');
    setIsIndeterminate(false);
    setStatusState('processing');
  }, []);

  return {
    isProcessing,
    progress,
    title,
    message,
    isIndeterminate,
    status,
    showProcessingModal,
    updateProcessingProgress,
    setStatus,
    hideProcessingModal,
  };
}
