import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; timezone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: Partial<{ name: string; email: string; avatar: string; timezone: string; preferences: any }>) =>
    api.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),

  savePushSubscription: (subscription: PushSubscription) =>
    api.post('/auth/push-subscription', { subscription }),
};

// Events API
export const eventsAPI = {
  getEvents: (params?: { start?: string; end?: string; calendar?: string; search?: string }) =>
    api.get('/events', { params }),

  getEvent: (id: string) => api.get(`/events/${id}`),

  createEvent: (data: any) => api.post('/events', data),

  updateEvent: (id: string, data: any) => api.put(`/events/${id}`, data),

  deleteEvent: (id: string) => api.delete(`/events/${id}`),

  duplicateEvent: (id: string, newStart?: string) =>
    api.post(`/events/${id}/duplicate`, { newStart }),

  getFreeSlots: (date: string, duration?: number) =>
    api.get('/events/suggestions/free-slots', { params: { date, duration } }),
};

// Calendars API
export const calendarsAPI = {
  getCalendars: () => api.get('/calendars'),

  getCalendar: (id: string) => api.get(`/calendars/${id}`),

  createCalendar: (data: { name: string; description?: string; color?: string; type?: string }) =>
    api.post('/calendars', data),

  updateCalendar: (id: string, data: any) => api.put(`/calendars/${id}`, data),

  deleteCalendar: (id: string) => api.delete(`/calendars/${id}`),

  toggleVisibility: (id: string) => api.put(`/calendars/${id}/visibility`),

  shareCalendar: (id: string, email: string, permission: 'view' | 'edit') =>
    api.post(`/calendars/${id}/share`, { email, permission }),

  removeShare: (calendarId: string, userId: string) =>
    api.delete(`/calendars/${calendarId}/share/${userId}`),
};

// Todos API
export const todosAPI = {
  getTodos: (params?: { status?: string; priority?: string; list?: string; dueDate?: string; search?: string }) =>
    api.get('/todos', { params }),

  getTodo: (id: string) => api.get(`/todos/${id}`),

  getLists: () => api.get('/todos/lists'),

  getStats: () => api.get('/todos/stats'),

  createTodo: (data: any) => api.post('/todos', data),

  updateTodo: (id: string, data: any) => api.put(`/todos/${id}`, data),

  deleteTodo: (id: string) => api.delete(`/todos/${id}`),

  toggleSubtask: (todoId: string, subtaskIndex: number) =>
    api.put(`/todos/${todoId}/subtask/${subtaskIndex}`),

  convertToEvent: (id: string, data: { start: string; end: string; calendarId?: string }) =>
    api.post(`/todos/${id}/convert-to-event`, data),

  reorder: (todos: Array<{ id: string; list: string }>) =>
    api.put('/todos/reorder', { todos }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number; skip?: number }) =>
    api.get('/notifications', { params }),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),

  deleteAll: () => api.delete('/notifications'),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (startDate?: string, endDate?: string) =>
    api.get('/analytics/overview', { params: { startDate, endDate } }),

  getProductivityScore: () => api.get('/analytics/productivity-score'),

  getTimeDistribution: (startDate?: string, endDate?: string) =>
    api.get('/analytics/time-distribution', { params: { startDate, endDate } }),

  getDailyActivity: (days?: number) =>
    api.get('/analytics/daily-activity', { params: { days } }),

  getPeakHours: () => api.get('/analytics/peak-hours'),
};

// Focus API
export const focusAPI = {
  getSessions: (params?: { status?: string; startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/focus/sessions', { params }),

  getStats: () => api.get('/focus/stats'),

  getActive: () => api.get('/focus/active'),

  startSession: (data: { plannedDuration: number; category?: string; linkedEvent?: string; linkedTodo?: string; notes?: string; tags?: string[] }) =>
    api.post('/focus/sessions', data),

  completeSession: (id: string, data?: { rating?: number; notes?: string }) =>
    api.put(`/focus/sessions/${id}/complete`, data),

  interruptSession: (id: string, note?: string) =>
    api.put(`/focus/sessions/${id}/interrupt`, { note }),

  cancelSession: (id: string) => api.put(`/focus/sessions/${id}/cancel`),

  logDistraction: (id: string, note?: string) =>
    api.post(`/focus/sessions/${id}/distraction`, { note }),
};

export default api;
