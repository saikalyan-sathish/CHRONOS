'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  FireIcon,
  ClockIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useFocusStore } from '@/store/useStore';
import { focusAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const categories = [
  { value: 'deep-work', label: 'Deep Work', color: '#3B82F6', icon: '🎯' },
  { value: 'meetings', label: 'Meetings', color: '#10B981', icon: '👥' },
  { value: 'admin', label: 'Admin', color: '#F59E0B', icon: '📋' },
  { value: 'creative', label: 'Creative', color: '#8B5CF6', icon: '🎨' },
  { value: 'learning', label: 'Learning', color: '#EC4899', icon: '📚' },
  { value: 'personal', label: 'Personal', color: '#06B6D4', icon: '🏠' },
];

const durations = [
  { value: 15, label: '15 min' },
  { value: 25, label: '25 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '90 min' },
];

export default function FocusPage() {
  const { activeSession, setActiveSession, sessions, setSessions } = useFocusStore();
  const [stats, setStats] = useState({
    today: { sessions: 0, minutes: 0 },
    week: { sessions: 0, minutes: 0 },
    month: { sessions: 0, minutes: 0 },
    streak: { current: 0, longest: 0 },
  });
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState('deep-work');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSession) {
      const elapsed = Math.floor(
        (Date.now() - new Date(activeSession.startTime).getTime()) / 1000
      );
      const remaining = activeSession.plannedDuration * 60 - elapsed;
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsRunning(true);
        setSelectedCategory(activeSession.category);
      } else {
        // Session completed
        handleComplete();
      }
    }
  }, [activeSession]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes, activeRes] = await Promise.all([
        focusAPI.getStats(),
        focusAPI.getSessions({ limit: 10 }),
        focusAPI.getActive(),
      ]);

      setStats(statsRes.data);
      setSessions(sessionsRes.data.sessions);

      if (activeRes.data.session) {
        setActiveSession(activeRes.data.session);
      }
    } catch (error) {
      console.error('Failed to load focus data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const response = await focusAPI.startSession({
        plannedDuration: selectedDuration,
        category: selectedCategory,
      });
      setActiveSession(response.data.session);
      setTimeLeft(selectedDuration * 60);
      setIsRunning(true);
      toast.success('Focus session started!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start session');
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Play completion sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => { });
    }

    if (activeSession) {
      try {
        await focusAPI.completeSession(activeSession._id, { rating: rating || undefined });
        toast.success('Focus session completed! Great work!');
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }

    setActiveSession(null);
    setTimeLeft(0);
    setRating(0);
    loadData();
  };

  const handleInterrupt = async () => {
    if (!activeSession) return;

    if (!confirm('Are you sure you want to interrupt this session?')) return;

    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      await focusAPI.interruptSession(activeSession._id, 'User interrupted');
      toast('Session interrupted');
      setActiveSession(null);
      setTimeLeft(0);
      loadData();
    } catch (error) {
      toast.error('Failed to interrupt session');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = activeSession
    ? ((activeSession.plannedDuration * 60 - timeLeft) / (activeSession.plannedDuration * 60)) * 100
    : 0;

  const currentCategory = categories.find((c) => c.value === selectedCategory);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Focus Mode
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Deep work sessions with the Pomodoro technique
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Today', value: `${stats.today.minutes}m`, sub: `${stats.today.sessions} sessions`, icon: ClockIcon },
            { label: 'This Week', value: `${Math.round(stats.week.minutes / 60)}h`, sub: `${stats.week.sessions} sessions`, icon: ChartBarIcon },
            { label: 'Current Streak', value: `${stats.streak.current}`, sub: 'days', icon: FireIcon },
            { label: 'Longest Streak', value: `${stats.streak.longest}`, sub: 'days', icon: FireIcon },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card text-center"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Timer */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card p-8 text-center"
        >
          {/* Category indicator */}
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${currentCategory?.color}20`, color: currentCategory?.color }}
              >
                <span>{currentCategory?.icon}</span>
                {currentCategory?.label}
              </span>
            </motion.div>
          )}

          {/* Timer circle */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-200 dark:text-dark-700"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={currentCategory?.color || '#3B82F6'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={283}
                strokeDashoffset={283 - (283 * progress) / 100}
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-900 dark:text-white font-mono">
                {activeSession ? formatTime(timeLeft) : formatTime(selectedDuration * 60)}
              </span>
              {activeSession && (
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {isRunning ? 'Focusing...' : 'Paused'}
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          {!activeSession ? (
            <>
              {/* Duration selector */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {durations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedDuration === d.value
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'bg-white/50 dark:bg-dark-700/50 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-dark-600/70 border border-white/20 dark:border-white/5'
                      }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm border ${selectedCategory === cat.value
                        ? 'ring-2 ring-offset-2 dark:ring-offset-dark-800 border-white/30'
                        : 'bg-white/50 dark:bg-dark-700/50 border-white/20 dark:border-white/5 text-gray-600 dark:text-gray-400'
                      }`}
                    style={{
                      backgroundColor: selectedCategory === cat.value ? `${cat.color}20` : undefined,
                      color: selectedCategory === cat.value ? cat.color : undefined,
                      ['--tw-ring-color' as string]: selectedCategory === cat.value ? cat.color : undefined,
                    }}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Start button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-semibold text-lg shadow-glow hover:shadow-glow-lg transition-all"
              >
                <PlayIcon className="w-6 h-6" />
                Start Focus Session
              </motion.button>
            </>
          ) : (
            <div className="flex justify-center gap-4">
              {isRunning ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-medium"
                >
                  <PauseIcon className="w-5 h-5" />
                  Pause
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResume}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium"
                >
                  <PlayIcon className="w-5 h-5" />
                  Resume
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium"
              >
                <StopIcon className="w-5 h-5" />
                Complete
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInterrupt}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Cancel
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Recent sessions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sessions
          </h3>
          {sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No focus sessions yet. Start your first session!
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session, index) => {
                const cat = categories.find((c) => c.value === session.category);
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/40 dark:bg-dark-700/40 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${cat?.color}20` }}
                      >
                        {cat?.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cat?.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(session.startTime), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {session.actualDuration || session.plannedDuration} min
                      </p>
                      <p
                        className={`text-sm ${session.status === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : session.status === 'interrupted'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-500'
                          }`}
                      >
                        {session.status}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hidden audio element for completion sound */}
        <audio ref={audioRef} preload="auto">
          <source src="/sounds/complete.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </DashboardLayout>
  );
}
