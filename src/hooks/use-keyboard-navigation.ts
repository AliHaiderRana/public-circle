import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  /**
   * Array of selectors for focusable elements
   * Default: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])']
   */
  selectors?: string[];
  /**
   * Container element ref or selector
   */
  container?: React.RefObject<HTMLElement> | string;
  /**
   * Enable arrow key navigation
   */
  arrowKeys?: boolean;
  /**
   * Enable Enter/Space key activation
   */
  activateOnEnter?: boolean;
  /**
   * Callback when an element is activated
   */
  onActivate?: (element: HTMLElement) => void;
  /**
   * Enable escape key handler
   */
  escapeKey?: boolean;
  /**
   * Callback when escape is pressed
   */
  onEscape?: () => void;
}

/**
 * Hook for managing keyboard navigation
 * Provides arrow key navigation, Enter/Space activation, and escape handling
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    selectors = ['button', 'a', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'],
    container,
    arrowKeys = true,
    activateOnEnter = true,
    onActivate,
    escapeKey = true,
    onEscape,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof container === 'string') {
      containerRef.current = document.querySelector(container);
    } else if (container?.current) {
      containerRef.current = container.current;
    } else {
      containerRef.current = document.body;
    }
  }, [container]);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = Array.from(
      containerRef.current.querySelectorAll(selectors.join(','))
    ) as HTMLElement[];

    return elements.filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        !el.hasAttribute('aria-hidden') &&
        el.offsetParent !== null &&
        window.getComputedStyle(el).visibility !== 'hidden'
    );
  }, [selectors]);

  const findNextElement = useCallback(
    (currentIndex: number, direction: 'next' | 'previous'): HTMLElement | null => {
      const elements = getFocusableElements();
      if (elements.length === 0) return null;

      if (direction === 'next') {
        return elements[currentIndex + 1] || elements[0];
      } else {
        return elements[currentIndex - 1] || elements[elements.length - 1];
      }
    },
    [getFocusableElements]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement || !containerRef.current?.contains(activeElement)) return;

      const elements = getFocusableElements();
      const currentIndex = elements.indexOf(activeElement);

      // Arrow key navigation
      if (arrowKeys && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const nextElement = findNextElement(currentIndex, 'next');
        nextElement?.focus();
      } else if (arrowKeys && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const prevElement = findNextElement(currentIndex, 'previous');
        prevElement?.focus();
      }

      // Enter/Space activation
      if (activateOnEnter && (e.key === 'Enter' || e.key === ' ')) {
        if (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button') {
          e.preventDefault();
          activeElement.click();
          onActivate?.(activeElement);
        }
      }

      // Escape key
      if (escapeKey && e.key === 'Escape') {
        onEscape?.();
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [arrowKeys, activateOnEnter, escapeKey, onActivate, onEscape, findNextElement, getFocusableElements]);

  return {
    containerRef,
    getFocusableElements,
    focusFirst: useCallback(() => {
      const elements = getFocusableElements();
      elements[0]?.focus();
    }, [getFocusableElements]),
    focusLast: useCallback(() => {
      const elements = getFocusableElements();
      elements[elements.length - 1]?.focus();
    }, [getFocusableElements]),
  };
}
