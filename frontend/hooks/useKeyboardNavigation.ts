'use client';

import { useCallback, useEffect, useRef } from 'react';
import { KEYS, getFocusableElements } from '@/lib/accessibility';
import { useAccessibilityStore } from '@/store/useStore';

interface KeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'grid';
  loop?: boolean;
  gridColumns?: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  enabled?: boolean;
}

/**
 * Hook for managing keyboard navigation within a container
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    orientation = 'horizontal',
    loop = true,
    gridColumns = 7,
    onSelect,
    onEscape,
    enabled = true,
  } = options;

  const currentIndexRef = useRef(0);
  const { keyboardNavigation } = useAccessibilityStore();

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return getFocusableElements(containerRef.current);
  }, [containerRef]);

  const moveFocus = useCallback(
    (direction: number) => {
      const items = updateFocusableElements();
      if (items.length === 0) return;

      let newIndex = currentIndexRef.current + direction;

      if (loop) {
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      }

      currentIndexRef.current = newIndex;

      // Update tabindex
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === newIndex ? '0' : '-1');
      });

      items[newIndex]?.focus();
    },
    [loop, updateFocusableElements]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || !keyboardNavigation) return;

      const items = updateFocusableElements();
      if (items.length === 0) return;

      switch (e.key) {
        case KEYS.ARROW_LEFT:
          if (orientation !== 'vertical') {
            e.preventDefault();
            moveFocus(-1);
          }
          break;
        case KEYS.ARROW_RIGHT:
          if (orientation !== 'vertical') {
            e.preventDefault();
            moveFocus(1);
          }
          break;
        case KEYS.ARROW_UP:
          if (orientation !== 'horizontal') {
            e.preventDefault();
            moveFocus(orientation === 'grid' ? -gridColumns : -1);
          }
          break;
        case KEYS.ARROW_DOWN:
          if (orientation !== 'horizontal') {
            e.preventDefault();
            moveFocus(orientation === 'grid' ? gridColumns : 1);
          }
          break;
        case KEYS.HOME:
          e.preventDefault();
          currentIndexRef.current = 0;
          items[0]?.focus();
          break;
        case KEYS.END:
          e.preventDefault();
          currentIndexRef.current = items.length - 1;
          items[items.length - 1]?.focus();
          break;
        case KEYS.ENTER:
        case KEYS.SPACE:
          if (onSelect) {
            e.preventDefault();
            onSelect(currentIndexRef.current);
          }
          break;
        case KEYS.ESCAPE:
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
        case KEYS.PAGE_UP:
          if (orientation === 'grid') {
            e.preventDefault();
            moveFocus(-gridColumns * 4); // Move up 4 weeks
          }
          break;
        case KEYS.PAGE_DOWN:
          if (orientation === 'grid') {
            e.preventDefault();
            moveFocus(gridColumns * 4); // Move down 4 weeks
          }
          break;
      }
    },
    [enabled, keyboardNavigation, orientation, gridColumns, moveFocus, onSelect, onEscape, updateFocusableElements]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);

    // Initialize tabindex
    const items = updateFocusableElements();
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, enabled, handleKeyDown, updateFocusableElements]);

  return {
    currentIndex: currentIndexRef.current,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = index;
      const items = updateFocusableElements();
      items.forEach((item, i) => {
        item.setAttribute('tabindex', i === index ? '0' : '-1');
      });
    },
    moveFocus,
  };
}

/**
 * Hook for global keyboard shortcuts
 */
export function useGlobalKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled: boolean = true
) {
  const { keyboardNavigation } = useAccessibilityStore();

  useEffect(() => {
    if (!enabled || !keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Build key combo string
      const combo = [
        e.ctrlKey ? 'ctrl' : '',
        e.metaKey ? 'meta' : '',
        e.altKey ? 'alt' : '',
        e.shiftKey ? 'shift' : '',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
      } else if (shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        shortcuts[e.key.toLowerCase()]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, keyboardNavigation]);
}
