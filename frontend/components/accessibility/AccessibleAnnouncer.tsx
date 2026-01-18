'use client';

import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';

interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null);

export const useAnnouncer = (): AnnouncerContextType => {
  const context = useContext(AnnouncerContext);
  if (!context) {
    // Return a no-op if used outside provider
    return {
      announce: () => {},
    };
  }
  return context;
};

interface AccessibleAnnouncerProps {
  children: React.ReactNode;
}

/**
 * Accessible announcer component that provides live regions for screen reader announcements
 * Must be placed near the root of the application
 */
export default function AccessibleAnnouncer({ children }: AccessibleAnnouncerProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('');
      // Use timeout to ensure screen reader picks up the change
      setTimeout(() => setAssertiveMessage(message), 50);
      setTimeout(() => setAssertiveMessage(''), 1000);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 50);
      setTimeout(() => setPoliteMessage(''), 1000);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}

      {/* Polite live region - for non-urgent updates */}
      <div
        id="accessible-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive live region - for urgent updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}
