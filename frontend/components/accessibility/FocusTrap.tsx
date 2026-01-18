'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { trapFocus, KEYS } from '@/lib/accessibility';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * Focus trap component for modals and dialogs
 * Traps focus within the container and handles escape key
 */
export default function FocusTrap({
  children,
  active = true,
  onEscape,
  restoreFocus = true,
  initialFocusRef,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === KEYS.ESCAPE && onEscape) {
        e.preventDefault();
        onEscape();
      }
    },
    [onEscape]
  );

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Set up focus trap
    const cleanup = trapFocus(containerRef.current);

    // Focus initial element or first focusable
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }

    // Add escape key handler
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cleanup();
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, initialFocusRef, handleKeyDown, restoreFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
