'use client';

import React from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

/**
 * Skip link component for keyboard users to skip to main content
 * Appears only on focus for keyboard navigation
 */
export default function SkipLink({
  href = '#main-content',
  children = 'Skip to main content'
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all"
    >
      {children}
    </a>
  );
}
