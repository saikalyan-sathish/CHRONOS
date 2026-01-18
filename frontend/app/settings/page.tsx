'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  SwatchIcon,
  ClockIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore, useUIStore } from '@/store/useStore';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const themeOptions = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

const viewOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'agenda', label: 'Agenda' },
];

const weekStartOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [loading, setLoading] = useState(false);

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Preferences
  const [defaultView, setDefaultView] = useState(user?.preferences?.defaultView || 'month');
  const [weekStartsOn, setWeekStartsOn] = useState(user?.preferences?.weekStartsOn || 0);
  const [workingHoursStart, setWorkingHoursStart] = useState(user?.preferences?.workingHours?.start || '09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState(user?.preferences?.workingHours?.end || '17:00');
  const [defaultEventDuration, setDefaultEventDuration] = useState(user?.preferences?.defaultEventDuration || 60);
  const [reminderTime, setReminderTime] = useState(user?.preferences?.notifications?.reminderTime || 15);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.notifications?.email ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.preferences?.notifications?.push ?? true);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setDefaultView(user.preferences?.defaultView || 'month');
      setWeekStartsOn(user.preferences?.weekStartsOn || 0);
      setWorkingHoursStart(user.preferences?.workingHours?.start || '09:00');
      setWorkingHoursEnd(user.preferences?.workingHours?.end || '17:00');
      setDefaultEventDuration(user.preferences?.defaultEventDuration || 60);
      setReminderTime(user.preferences?.notifications?.reminderTime || 15);
      setEmailNotifications(user.preferences?.notifications?.email ?? true);
      setPushNotifications(user.preferences?.notifications?.push ?? true);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile({
        name,
        email,
        preferences: {
          defaultView,
          weekStartsOn,
          workingHours: {
            start: workingHoursStart,
            end: workingHoursEnd,
          },
          defaultEventDuration,
          notifications: {
            email: emailNotifications,
            push: pushNotifications,
            reminderTime,
          },
        },
      });
      updateUser(response.data.user);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Push notifications enabled');
      setPushNotifications(true);
    } else {
      toast.error('Push notification permission denied');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <UserCircleIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <SwatchIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme
            </label>
            <div className="flex gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    theme === option.value
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Calendar Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <ClockIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Calendar Preferences
            </h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default View
                </label>
                <select
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value)}
                  className="input"
                >
                  {viewOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Week Starts On
                </label>
                <select
                  value={weekStartsOn}
                  onChange={(e) => setWeekStartsOn(Number(e.target.value))}
                  className="input"
                >
                  {weekStartOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Working Hours
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="input"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Event Duration
              </label>
              <select
                value={defaultEventDuration}
                onChange={(e) => setDefaultEventDuration(Number(e.target.value))}
                className="input"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <BellIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email reminders for events
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailNotifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive browser notifications
                </p>
              </div>
              <button
                onClick={() => {
                  if (!pushNotifications) {
                    handleEnablePushNotifications();
                  } else {
                    setPushNotifications(false);
                  }
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  pushNotifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    pushNotifications ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Reminder Time
              </label>
              <select
                value={reminderTime}
                onChange={(e) => setReminderTime(Number(e.target.value))}
                className="input"
              >
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheckIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirm new password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="btn btn-secondary disabled:opacity-50"
            >
              Change Password
            </button>
          </div>
        </motion.div>

        {/* Save button */}
        <div className="flex justify-end gap-4 pb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveProfile}
            disabled={loading}
            className="btn btn-primary px-8"
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}
