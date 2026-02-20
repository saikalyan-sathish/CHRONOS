'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuthStore, useUIStore, useNotificationStore, useCalendarStore, useFocusStore } from '@/store/useStore';
import { notificationsAPI, focusAPI } from '@/lib/api';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, Bars3Icon } from '@heroicons/react/24/outline';
import MobileNavigation from './MobileNavigation';
import Background from './Background';
import EventModal from '../calendar/EventModal';

let socket: Socket | null = null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, eventModalOpen, setEventModalOpen } = useUIStore();
  const { setNotifications, setUnreadCount, addNotification } = useNotificationStore();
  const { addEvent, updateEvent, removeEvent } = useCalendarStore();
  const { setActiveSession } = useFocusStore();
  const [loading, setLoading] = useState(true);

  const {
    executeUndo,
    executeRedo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
  } = useUndoRedo();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    // Load notifications
    loadNotifications();

    // Check for active focus session
    checkActiveFocusSession();

    // Connect to WebSocket
    connectSocket();

    setLoading(false);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 20 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const checkActiveFocusSession = async () => {
    try {
      const response = await focusAPI.getActive();
      if (response.data.session) {
        setActiveSession(response.data.session);
      }
    } catch (error) {
      console.error('Failed to check active focus session:', error);
    }
  };

  const connectSocket = () => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      if (user?._id) {
        socket?.emit('join', user._id);
      }
    });

    socket.on('notification', (data) => {
      addNotification(data.notification);
      toast(data.notification.message, {
        icon: '🔔',
        duration: 5000,
      });
    });

    socket.on('event:created', (event) => {
      addEvent(event);
    });

    socket.on('event:updated', (event) => {
      updateEvent(event._id, event);
    });

    socket.on('event:deleted', (data) => {
      removeEvent(data.id);
    });

    socket.on('focus:completed', (session) => {
      setActiveSession(null);
      toast.success('Focus session completed!');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-gray-900 dark:text-gray-100">
      <Background />
      <Sidebar />
      <MobileNavigation onAddClick={() => setEventModalOpen(true)} />

      <main
        className={`transition-all duration-300 min-h-screen pb-20 lg:pb-0 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[80px]'
          }`}
      >
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-4 left-4 z-40 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 rounded-xl bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass hover:bg-white/90 dark:hover:bg-dark-800/90 transition-all"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Undo/Redo Toolbar - Hidden on mobile, positioned at bottom right on desktop to avoid overlap */}
        <div className="hidden lg:flex fixed bottom-6 right-6 z-40 undo-redo-toolbar items-center gap-1 bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-glass p-1">
          <button
            onClick={executeUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-all ${canUndo
              ? 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            title={undoDescription ? `Undo: ${undoDescription}` : 'Undo (Ctrl+Z)'}
            aria-label="Undo"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={executeRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-all ${canRedo
              ? 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            title={redoDescription ? `Redo: ${redoDescription}` : 'Redo (Ctrl+Shift+Z)'}
            aria-label="Redo"
          >
            <ArrowUturnRightIcon className="w-5 h-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 pb-24 lg:pb-6"
        >
          {children}
        </motion.div>
      </main>

      {/* Global Event Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={() => setEventModalOpen(false)}
      />
    </div>
  );
}
