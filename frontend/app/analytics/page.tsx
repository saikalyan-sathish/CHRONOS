'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { format, subDays } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { analyticsAPI } from '@/lib/api';
import type { AnalyticsOverview, ProductivityScore } from '@/types';

const categoryColors: Record<string, string> = {
  'deep-work': '#3B82F6',
  meetings: '#10B981',
  admin: '#F59E0B',
  creative: '#8B5CF6',
  learning: '#EC4899',
  personal: '#06B6D4',
  other: '#6B7280',
};

const categoryIcons: Record<string, string> = {
  'deep-work': '🎯',
  meetings: '👥',
  admin: '📋',
  creative: '🎨',
  learning: '📚',
  personal: '🏠',
  other: '📌',
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [productivityScore, setProductivityScore] = useState<ProductivityScore | null>(null);
  const [timeDistribution, setTimeDistribution] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      const endDate = new Date().toISOString();

      const [overviewRes, scoreRes, distributionRes, activityRes, peakRes] = await Promise.all([
        analyticsAPI.getOverview(startDate, endDate),
        analyticsAPI.getProductivityScore(),
        analyticsAPI.getTimeDistribution(startDate, endDate),
        analyticsAPI.getDailyActivity(parseInt(dateRange)),
        analyticsAPI.getPeakHours(),
      ]);

      setOverview(overviewRes.data);
      setProductivityScore(scoreRes.data);
      setTimeDistribution(distributionRes.data.distribution);
      setDailyActivity(activityRes.data.activity);
      setPeakHours(peakRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track your productivity and time usage
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-auto"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Productivity Score */}
        {productivityScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score circle */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200 dark:text-dark-700"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={
                      productivityScore.score >= 80
                        ? '#22c55e'
                        : productivityScore.score >= 60
                        ? '#eab308'
                        : productivityScore.score >= 40
                        ? '#f97316'
                        : '#ef4444'
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={283}
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * productivityScore.score) / 100 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(productivityScore.score)}`}>
                    {productivityScore.score}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">out of 100</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Productivity Score
                </h2>
                <p className={`text-lg font-medium ${getScoreColor(productivityScore.score)} mb-4`}>
                  {getScoreLabel(productivityScore.score)}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  {productivityScore.trend === 'up' ? (
                    <>
                      <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-medium">Improving</span>
                    </>
                  ) : productivityScore.trend === 'down' ? (
                    <>
                      <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-medium">Declining</span>
                    </>
                  ) : (
                    <span className="text-gray-500 font-medium">Stable</span>
                  )}
                  <span className="text-gray-400 dark:text-gray-500">vs last week</span>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Tasks', value: productivityScore.breakdown.todos, icon: CheckCircleIcon },
                    { label: 'Focus', value: productivityScore.breakdown.focus, icon: ClockIcon },
                    { label: 'Events', value: productivityScore.breakdown.events, icon: CalendarDaysIcon },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <item.icon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.value}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Events',
                value: overview.events.total,
                sub: `${overview.events.totalHours}h total`,
                icon: CalendarDaysIcon,
                color: 'bg-blue-500',
              },
              {
                label: 'Tasks Completed',
                value: overview.todos.completed,
                sub: `${overview.todos.completionRate}% rate`,
                icon: CheckCircleIcon,
                color: 'bg-green-500',
              },
              {
                label: 'Focus Sessions',
                value: overview.focus.totalSessions,
                sub: `${Math.round(overview.focus.totalMinutes / 60)}h total`,
                icon: FireIcon,
                color: 'bg-orange-500',
              },
              {
                label: 'Avg Session',
                value: `${overview.focus.avgSessionLength}m`,
                sub: 'focus time',
                icon: ClockIcon,
                color: 'bg-purple-500',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Time Distribution by Category
          </h3>
          {timeDistribution.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No time data available for this period
            </p>
          ) : (
            <div className="space-y-4">
              {timeDistribution.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{categoryIcons[item.category] || '📌'}</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {item.category.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.hours}h
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: categoryColors[item.category] || '#6B7280' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Daily Activity
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {dailyActivity.slice(-35).map((day, index) => {
              const intensity = Math.min(day.score / 100, 1);
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className="aspect-square rounded-md cursor-pointer relative group"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`,
                  }}
                  title={`${format(new Date(day.date), 'MMM d')}: ${day.events} events, ${day.todosCompleted} tasks, ${day.focusMinutes}m focus`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {format(new Date(day.date), 'MMM d')}
                      <br />
                      {day.events} events, {day.todosCompleted} tasks
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
              <div
                key={intensity}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
              />
            ))}
            <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
          </div>
        </motion.div>

        {/* Peak Hours */}
        {peakHours && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Peak Productivity Hours
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{peakHours.recommendation}</p>
            <div className="grid grid-cols-12 gap-1">
              {peakHours.hourlyData?.map((hour: any, index: number) => {
                const maxMinutes = Math.max(...peakHours.hourlyData.map((h: any) => h.totalMinutes || 0));
                const height = maxMinutes > 0 ? (hour.totalMinutes / maxMinutes) * 100 : 0;
                const isPeak = peakHours.peakHours?.includes(hour.hour);
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="w-full h-24 flex items-end justify-center">
                      <motion.div
                        className={`w-full rounded-t-sm ${isPeak ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 5)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {hour.hour % 6 === 0 ? `${hour.hour}:00` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
