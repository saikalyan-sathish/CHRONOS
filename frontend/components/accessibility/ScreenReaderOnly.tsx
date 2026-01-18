'use client';

import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  focusable?: boolean;
}

/**
 * Component that visually hides content but keeps it accessible to screen readers
 */
export default function ScreenReaderOnly({
  children,
  as: Component = 'span',
  focusable = false,
}: ScreenReaderOnlyProps) {
  const className = focusable
    ? 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:dark:bg-dark-800 focus:p-4 focus:rounded-lg focus:shadow-lg'
    : 'sr-only';

  return <Component className={className}>{children}</Component>;
}
