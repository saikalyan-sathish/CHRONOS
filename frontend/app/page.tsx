'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { LazyMotion, domAnimation, m } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (isAuthenticated) {
        router.push('/calendar');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router, mounted]);

  // Show simple loading state before hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-dark-900 dark:to-dark-800">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <h1 className="text-2xl font-bold text-white">Chronos</h1>
          <p className="text-white/80 mt-2">Loading your productivity suite...</p>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-dark-900 dark:to-dark-800">
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center"
        >
          <div
            className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <h1 className="text-2xl font-bold text-white">Chronos</h1>
          <p className="text-white/80 mt-2">Loading your productivity suite...</p>
        </m.div>
      </div>
    </LazyMotion>
  );
}
