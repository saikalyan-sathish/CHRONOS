'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Calendar, Event, Todo, Notification, FocusSession, CalendarView } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface CalendarState {
  calendars: Calendar[];
  currentView: CalendarView;
  currentDate: Date;
  selectedEvent: Event | null;
  events: Event[];
  setCalendars: (calendars: Calendar[]) => void;
  addCalendar: (calendar: Calendar) => void;
  updateCalendar: (id: string, data: Partial<Calendar>) => void;
  removeCalendar: (id: string) => void;
  setCurrentView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedEvent: (event: Event | null) => void;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, data: Partial<Event>) => void;
  removeEvent: (id: string) => void;
}

interface TodoState {
  todos: Todo[];
  selectedTodo: Todo | null;
  currentList: string;
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, data: Partial<Todo>) => void;
  removeTodo: (id: string) => void;
  setSelectedTodo: (todo: Todo | null) => void;
  setCurrentList: (list: string) => void;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
}

interface FocusState {
  activeSession: FocusSession | null;
  sessions: FocusSession[];
  setActiveSession: (session: FocusSession | null) => void;
  setSessions: (sessions: FocusSession[]) => void;
  addSession: (session: FocusSession) => void;
  updateSession: (id: string, data: Partial<FocusSession>) => void;
}

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  eventModalOpen: boolean;
  todoModalOpen: boolean;
  focusModalOpen: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setEventModalOpen: (open: boolean) => void;
  setTodoModalOpen: (open: boolean) => void;
  setFocusModalOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useCalendarStore = create<CalendarState>((set) => ({
  calendars: [],
  currentView: 'month',
  currentDate: new Date(),
  selectedEvent: null,
  events: [],
  setCalendars: (calendars) => set({ calendars }),
  addCalendar: (calendar) =>
    set((state) => ({ calendars: [...state.calendars, calendar] })),
  updateCalendar: (id, data) =>
    set((state) => ({
      calendars: state.calendars.map((c) =>
        c._id === id ? { ...c, ...data } : c
      ),
    })),
  removeCalendar: (id) =>
    set((state) => ({
      calendars: state.calendars.filter((c) => c._id !== id),
    })),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (id, data) =>
    set((state) => ({
      events: state.events.map((e) => (e._id === id ? { ...e, ...data } : e)),
    })),
  removeEvent: (id) =>
    set((state) => ({ events: state.events.filter((e) => e._id !== id) })),
}));

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  selectedTodo: null,
  currentList: 'inbox',
  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
  updateTodo: (id, data) =>
    set((state) => ({
      todos: state.todos.map((t) => (t._id === id ? { ...t, ...data } : t)),
    })),
  removeTodo: (id) =>
    set((state) => ({ todos: state.todos.filter((t) => t._id !== id) })),
  setSelectedTodo: (todo) => set({ selectedTodo: todo }),
  setCurrentList: (list) => set({ currentList: list }),
}));

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

export const useFocusStore = create<FocusState>((set) => ({
  activeSession: null,
  sessions: [],
  setActiveSession: (session) => set({ activeSession: session }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (id, data) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s._id === id ? { ...s, ...data } : s)),
      activeSession:
        state.activeSession?._id === id
          ? { ...state.activeSession, ...data }
          : state.activeSession,
    })),
}));

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      eventModalOpen: false,
      todoModalOpen: false,
      focusModalOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setEventModalOpen: (open) => set({ eventModalOpen: open }),
      setTodoModalOpen: (open) => set({ todoModalOpen: open }),
      setFocusModalOpen: (open) => set({ focusModalOpen: open }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
