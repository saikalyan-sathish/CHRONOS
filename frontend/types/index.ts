export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  timezone: string;
  preferences: UserPreferences;
  focusStats: FocusStats;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: number;
  defaultView: 'day' | 'week' | 'month' | 'agenda';
  defaultEventDuration: number;
  workingHours: {
    start: string;
    end: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    reminderTime: number;
  };
  accessibility?: AccessibilityPreferences;
}

export interface AccessibilityPreferences {
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  focusIndicators: 'default' | 'enhanced';
}

export interface FocusStats {
  totalFocusTime: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastFocusDate?: string;
}

export interface Calendar {
  _id: string;
  name: string;
  description?: string;
  color: string;
  user: string | User;
  isDefault: boolean;
  isVisible: boolean;
  type: 'personal' | 'work' | 'family' | 'holiday' | 'birthday' | 'other';
  shared: {
    isShared: boolean;
    sharedWith: Array<{
      user: string;
      permission: 'view' | 'edit';
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  calendar: Calendar | string;
  user: string;
  recurrence?: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
    count?: number;
    exceptions?: string[];
  };
  reminders: Array<{
    type: 'notification' | 'email';
    time: number;
    sent: boolean;
  }>;
  attendees?: Array<{
    email: string;
    name?: string;
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
  isFocusTime: boolean;
  focusCategory?: 'deep-work' | 'meetings' | 'admin' | 'creative' | 'learning' | 'personal';
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  _id: string;
  title: string;
  description?: string;
  user: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  tags?: string[];
  color: string;
  list: string;
  subtasks: Array<{
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  reminder?: {
    enabled: boolean;
    time?: string;
    sent: boolean;
  };
  recurring?: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  linkedEvent?: string;
  estimatedTime?: number;
  actualTime?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'event_reminder' | 'todo_reminder' | 'event_update' | 'todo_due' | 'focus_complete' | 'achievement' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  relatedEvent?: Event;
  relatedTodo?: Todo;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface FocusSession {
  _id: string;
  user: string;
  startTime: string;
  endTime?: string;
  plannedDuration: number;
  actualDuration?: number;
  status: 'active' | 'completed' | 'interrupted' | 'cancelled';
  category: 'deep-work' | 'meetings' | 'admin' | 'creative' | 'learning' | 'personal';
  linkedEvent?: Event;
  linkedTodo?: Todo;
  notes?: string;
  distractions: Array<{
    timestamp: string;
    note?: string;
  }>;
  rating?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FreeSlot {
  start: string;
  end: string;
  duration: number;
}

export interface AnalyticsOverview {
  dateRange: {
    start: string;
    end: string;
  };
  events: {
    total: number;
    byCategory: Record<string, number>;
    byPriority: {
      low: number;
      medium: number;
      high: number;
    };
    totalHours: number;
  };
  todos: {
    total: number;
    completed: number;
    completionRate: number;
    byPriority: Record<string, number>;
    avgCompletionTime: number;
  };
  focus: {
    totalSessions: number;
    totalMinutes: number;
    avgSessionLength: number;
    byCategory: Record<string, number>;
  };
}

export interface ProductivityScore {
  score: number;
  breakdown: {
    todos: number;
    focus: number;
    events: number;
  };
  trend: 'up' | 'down' | 'stable';
  details: {
    todosCompleted: number;
    todosTotal: number;
    focusMinutes: number;
    eventsAttended: number;
    eventsTotal: number;
  };
}

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export interface EventTemplate {
  _id: string;
  user: string;
  name: string;
  title: string;
  description?: string;
  location?: string;
  duration: number;
  color: string;
  category: 'work' | 'personal' | 'health' | 'social' | 'other';
  priority: 'low' | 'medium' | 'high';
  recurrence?: {
    pattern: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
  };
  reminders?: number[];
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
