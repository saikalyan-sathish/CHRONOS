'use client';

import { useState, useEffect, useCallback } from 'react';
import { prefersReducedMotion, getAnimationDuration } from '@/lib/accessibility';
import { useAccessibilityStore } from '@/store/useStore';

/**
 * Hook that detects user's reduced motion preference
 * Combines system preference with user setting
 */
export function useReducedMotion(): boolean {
  const { reducedMotion: userPreference } = useAccessibilityStore();
  const [systemPreference, setSystemPreference] = useState(false);

  useEffect(() => {
    // Get initial system preference
    setSystemPreference(prefersReducedMotion());

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // User preference takes priority, otherwise use system preference
  return userPreference ?? systemPreference;
}

/**
 * Hook that provides animation properties based on reduced motion preference
 */
export function useAnimationPreference() {
  const reducedMotion = useReducedMotion();

  const getTransition = useCallback(
    (normalDuration: number = 300) => {
      return {
        duration: getAnimationDuration(normalDuration, reducedMotion) / 1000,
        ease: reducedMotion ? 'linear' : 'easeInOut',
      };
    },
    [reducedMotion]
  );

  const getVariants = useCallback(
    (normalVariants: Record<string, any>, reducedVariants?: Record<string, any>) => {
      if (reducedMotion && reducedVariants) {
        return reducedVariants;
      }
      if (reducedMotion) {
        // Create instant variants by removing animation properties
        return Object.fromEntries(
          Object.entries(normalVariants).map(([key, value]) => [
            key,
            { ...value, transition: { duration: 0 } },
          ])
        );
      }
      return normalVariants;
    },
    [reducedMotion]
  );

  return {
    reducedMotion,
    getTransition,
    getVariants,
    // Common animation presets
    fadeIn: reducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slideIn: reducedMotion
      ? { initial: { y: 0, opacity: 1 }, animate: { y: 0, opacity: 1 } }
      : { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    scaleIn: reducedMotion
      ? { initial: { scale: 1, opacity: 1 }, animate: { scale: 1, opacity: 1 } }
      : { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  };
}

/**
 * Hook that provides CSS variables for animation control
 */
export function useAnimationCSS() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--animation-duration',
      reducedMotion ? '0ms' : '300ms'
    );
    document.documentElement.style.setProperty(
      '--transition-duration',
      reducedMotion ? '0ms' : '200ms'
    );
  }, [reducedMotion]);

  return reducedMotion;
}
