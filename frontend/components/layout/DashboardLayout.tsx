'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuthStore, useUIStore, useNotificationStore, useCalendarStore, useFocusStore } from '@/store/useStore';
import { notificationsAPI, focusAPI } from '@/lib/api';

let socket: Socket | null = null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const { setNotifications, setUnreadCount, addNotification } = useNotificationStore();
  const { addEvent, updateEvent, removeEvent } = useCalendarStore();
  const { setActiveSession } = useFocusStore();
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Sidebar />
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[80px]'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
