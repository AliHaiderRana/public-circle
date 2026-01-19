import { useEffect, useRef, useCallback } from 'react';

interface UseFocusManagementOptions {
  /**
   * Whether to trap focus within the container
   */
  trapFocus?: boolean;
  /**
   * Whether to restore focus when component unmounts
   */
  restoreFocus?: boolean;
  /**
   * Whether to focus the container on mount
   */
  autoFocus?: boolean;
  /**
   * Initial focus element selector
   */
  initialFocus?: string;
  /**
   * Callback when focus is trapped
   */
  onFocusTrap?: () => void;
}

/**
 * Hook for managing focus within a component
 * Provides focus trapping, restoration, and auto-focus capabilities
 */
export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const {
    trapFocus = false,
    restoreFocus = true,
    autoFocus = false,
    initialFocus,
    onFocusTrap,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus]);

  // Auto-focus on mount
  useEffect(() => {
    if (!containerRef.current) return;

    if (autoFocus) {
      if (initialFocus && containerRef.current) {
        const element = containerRef.current.querySelector(initialFocus) as HTMLElement;
        element?.focus();
      } else {
        containerRef.current.focus();
      }
    }
  }, [autoFocus, initialFocus]);

  // Focus trapping
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement || !container.contains(activeElement)) {
          e.preventDefault();
          lastElement.focus();
          onFocusTrap?.();
        }
      } else {
        // Tab
        if (activeElement === lastElement || !container.contains(activeElement)) {
          e.preventDefault();
          firstElement.focus();
          onFocusTrap?.();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus, onFocusTrap]);

  // Restore focus on unmount
  useEffect(() => {
    if (!restoreFocus) return;

    return () => {
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [restoreFocus]);

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const elements = containerRef.current.querySelectorAll(focusableSelectors);
    (elements[0] as HTMLElement)?.focus();
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const elements = containerRef.current.querySelectorAll(focusableSelectors);
    (elements[elements.length - 1] as HTMLElement)?.focus();
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
  };
}
