'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore, useUIStore, useNotificationStore, useCalendarStore } from '@/store/useStore';
import { calendarsAPI } from '@/lib/api';

const navigation = [
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Tasks', href: '/todos', icon: CheckCircleIcon },
  { name: 'Focus', href: '/focus', icon: ClockIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const { calendars, setCalendars } = useCalendarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    try {
      const response = await calendarsAPI.getCalendars();
      setCalendars(response.data.calendars);
    } catch (error) {
      console.error('Failed to load calendars:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x: 0,
        }}
        className={`fixed left-0 top-0 h-full bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 z-50 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-700">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Chronos
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-mini"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <CalendarIcon className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors lg:block hidden"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                <item.icon
                  className={`w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : ''
                  }`}
                />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Calendars */}
        {sidebarOpen && calendars.length > 0 && (
          <div className="px-3 py-4 border-t border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-3 px-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Calendars
              </span>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700">
                <PlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-1">
              {calendars.slice(0, 5).map((calendar) => (
                <div
                  key={calendar._id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {calendar.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-dark-700 space-y-2">
          {/* Notifications */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors relative">
            <BellIcon className="w-6 h-6 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Notifications</span>}
            {unreadCount > 0 && (
              <span className="absolute top-2 left-7 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            {theme === 'dark' ? (
              <MoonIcon className="w-6 h-6 flex-shrink-0" />
            ) : (
              <SunIcon className="w-6 h-6 flex-shrink-0" />
            )}
            {sidebarOpen && (
              <span className="font-medium capitalize">
                {theme} Mode
              </span>
            )}
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
