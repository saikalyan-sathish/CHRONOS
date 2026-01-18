// Accessibility utilities for Chronos Calendar

/**
 * Generates a unique ID for ARIA attributes
 */
export const generateAriaId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Key codes for keyboard navigation
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

/**
 * Trap focus within an element
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== KEYS.TAB) return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Get focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  );
};

/**
 * Announce message to screen readers
 */
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcer = document.getElementById('accessible-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};

/**
 * Format date for screen readers
 */
export const formatDateForScreenReader = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time for screen readers
 */
export const formatTimeForScreenReader = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format event for screen reader announcement
 */
export const formatEventForScreenReader = (event: {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}): string => {
  if (event.allDay) {
    return `${event.title}, all day on ${formatDateForScreenReader(event.start)}`;
  }
  return `${event.title}, ${formatDateForScreenReader(event.start)} from ${formatTimeForScreenReader(event.start)} to ${formatTimeForScreenReader(event.end)}`;
};

/**
 * Get calendar navigation instructions
 */
export const getCalendarNavigationInstructions = (): string => {
  return 'Use arrow keys to navigate between days, Page Up and Page Down to move between months, Home and End to go to start or end of week. Press Enter or Space to select a day.';
};

/**
 * Check if reduced motion is preferred
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if high contrast is preferred
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
};

/**
 * Get appropriate animation duration based on reduced motion preference
 */
export const getAnimationDuration = (normalDuration: number, reducedMotion: boolean): number => {
  return reducedMotion ? 0 : normalDuration;
};

/**
 * CSS custom properties for high contrast mode
 */
export const highContrastStyles = `
  :root[data-high-contrast="true"] {
    --color-primary: #0000FF;
    --color-primary-dark: #0000CC;
    --color-text: #000000;
    --color-text-secondary: #333333;
    --color-background: #FFFFFF;
    --color-surface: #FFFFFF;
    --color-border: #000000;
    --color-error: #FF0000;
    --color-success: #008000;
    --color-warning: #FF8C00;
    --focus-ring-width: 3px;
    --focus-ring-color: #0000FF;
  }

  :root[data-high-contrast="true"][data-theme="dark"] {
    --color-primary: #00FFFF;
    --color-primary-dark: #00CCCC;
    --color-text: #FFFFFF;
    --color-text-secondary: #CCCCCC;
    --color-background: #000000;
    --color-surface: #1A1A1A;
    --color-border: #FFFFFF;
    --color-error: #FF6B6B;
    --color-success: #00FF00;
    --color-warning: #FFFF00;
    --focus-ring-width: 3px;
    --focus-ring-color: #00FFFF;
  }
`;

/**
 * Create a roving tabindex handler for a group of elements
 */
export const createRovingTabindex = (
  items: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'grid';
    loop?: boolean;
    gridColumns?: number;
  } = {}
) => {
  const { orientation = 'horizontal', loop = true, gridColumns = 7 } = options;
  let currentIndex = 0;

  const updateTabindex = () => {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
    });
  };

  const moveFocus = (direction: number) => {
    let newIndex = currentIndex + direction;

    if (loop) {
      if (newIndex < 0) newIndex = items.length - 1;
      if (newIndex >= items.length) newIndex = 0;
    } else {
      newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
    }

    currentIndex = newIndex;
    updateTabindex();
    items[currentIndex]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
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
        currentIndex = 0;
        updateTabindex();
        items[0]?.focus();
        break;
      case KEYS.END:
        e.preventDefault();
        currentIndex = items.length - 1;
        updateTabindex();
        items[items.length - 1]?.focus();
        break;
    }
  };

  updateTabindex();

  return {
    handleKeyDown,
    setCurrentIndex: (index: number) => {
      currentIndex = index;
      updateTabindex();
    },
    getCurrentIndex: () => currentIndex,
  };
};
