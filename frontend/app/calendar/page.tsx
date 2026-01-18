'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isToday,
  parseISO,
  differenceInMinutes,
} from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarDaysIcon,
  ViewColumnsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventModal from '@/components/calendar/EventModal';
import EventCard from '@/components/calendar/EventCard';
import { useCalendarStore, useUIStore } from '@/store/useStore';
import { eventsAPI } from '@/lib/api';
import type { Event, CalendarView } from '@/types';
import toast from 'react-hot-toast';

const viewOptions: { value: CalendarView; label: string; icon: any }[] = [
  { value: 'month', label: 'Month', icon: CalendarDaysIcon },
  { value: 'week', label: 'Week', icon: ViewColumnsIcon },
  { value: 'day', label: 'Day', icon: ListBulletIcon },
];

const hours = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const {
    currentDate,
    currentView,
    events,
    selectedEvent,
    setCurrentDate,
    setCurrentView,
    setEvents,
    setSelectedEvent,
  } = useCalendarStore();
  const { setEventModalOpen, eventModalOpen } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  useEffect(() => {
    loadEvents();
  }, [currentDate, currentView]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let start: Date, end: Date;

      if (currentView === 'month') {
        start = startOfWeek(startOfMonth(currentDate));
        end = endOfWeek(endOfMonth(currentDate));
      } else if (currentView === 'week') {
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
      } else {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      }

      const response = await eventsAPI.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const modifier = direction === 'prev' ? -1 : 1;

    if (currentView === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const handleDateClick = (date: Date) => {
    setNewEventDate(date);
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start);
      return isSameDay(eventStart, date);
    });
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start);
      return isSameDay(eventStart, date) && eventStart.getHours() === hour;
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-dark-700">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => handleDateClick(day)}
                className={`min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-dark-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-dark-700 ${
                  !isCurrentMonth ? 'bg-gray-50 dark:bg-dark-900/50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full transition-colors ${
                      isCurrentDay
                        ? 'bg-primary-500 text-white font-bold'
                        : isCurrentMonth
                        ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-dark-600'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className="px-2 py-1 text-xs font-medium rounded-md truncate cursor-pointer transition-transform hover:scale-105"
                      style={{
                        backgroundColor: `${event.color}20`,
                        color: event.color,
                        borderLeft: `3px solid ${event.color}`,
                      }}
                    >
                      {event.title}
                    </motion.div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate),
    });

    return (
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-dark-700">
          <div className="py-3 px-2 text-center text-sm font-semibold text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-dark-700" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`py-3 text-center border-r border-gray-200 dark:border-dark-700 last:border-r-0 ${
                isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                {format(day, 'EEE')}
              </span>
              <p
                className={`text-lg font-bold ${
                  isToday(day)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="h-[600px] overflow-y-auto">
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-gray-100 dark:border-dark-700"
              >
                <div className="py-4 px-2 text-xs text-gray-400 dark:text-gray-500 text-right border-r border-gray-200 dark:border-dark-700">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                {weekDays.map((day) => {
                  const hourEvents = getEventsForHour(day, hour);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onClick={() => {
                        const eventDate = new Date(day);
                        eventDate.setHours(hour, 0, 0, 0);
                        handleDateClick(eventDate);
                      }}
                      className="relative min-h-[60px] border-r border-gray-100 dark:border-dark-700 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/50"
                    >
                      {hourEvents.map((event) => (
                        <motion.div
                          key={event._id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className="absolute inset-x-1 top-1 p-2 rounded-lg text-xs font-medium cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          style={{
                            backgroundColor: event.color,
                            color: '#fff',
                            height: `${Math.max(
                              30,
                              (differenceInMinutes(
                                parseISO(event.end),
                                parseISO(event.start)
                              ) /
                                60) *
                                60 -
                                4
                            )}px`,
                          }}
                        >
                          <p className="font-semibold truncate">{event.title}</p>
                          <p className="opacity-80 truncate">
                            {format(parseISO(event.start), 'h:mm a')}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft overflow-hidden">
        {/* Header */}
        <div className="py-4 px-6 border-b border-gray-200 dark:border-dark-700 text-center">
          <p
            className={`text-2xl font-bold ${
              isToday(currentDate)
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </p>
          {isToday(currentDate) && (
            <span className="inline-block mt-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium rounded-full">
              Today
            </span>
          )}
        </div>

        {/* Time grid */}
        <div className="h-[600px] overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(currentDate, hour);
            return (
              <div
                key={hour}
                onClick={() => {
                  const eventDate = new Date(currentDate);
                  eventDate.setHours(hour, 0, 0, 0);
                  handleDateClick(eventDate);
                }}
                className="flex border-b border-gray-100 dark:border-dark-700 min-h-[80px] cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/50"
              >
                <div className="w-20 py-4 px-4 text-sm text-gray-400 dark:text-gray-500 text-right border-r border-gray-200 dark:border-dark-700 flex-shrink-0">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                <div className="flex-1 p-2 relative">
                  {hourEvents.map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className="p-3 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all"
                      style={{
                        backgroundColor: `${event.color}15`,
                        borderLeft: `4px solid ${event.color}`,
                      }}
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {format(parseISO(event.start), 'h:mm a')} -{' '}
                        {format(parseISO(event.end), 'h:mm a')}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          📍 {event.location}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentView === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : currentView === 'week'
                ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
                : format(currentDate, 'MMMM d, yyyy')}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('prev')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => navigate('today')}
                className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigate('next')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View switcher */}
            <div className="flex bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCurrentView(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === option.value
                      ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Add event button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setNewEventDate(new Date());
                setSelectedEvent(null);
                setEventModalOpen(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Add Event</span>
            </motion.button>
          </div>
        </div>

        {/* Calendar view */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft p-12 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"
                />
              </div>
            ) : currentView === 'month' ? (
              renderMonthView()
            ) : currentView === 'week' ? (
              renderWeekView()
            ) : (
              renderDayView()
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
          setNewEventDate(null);
        }}
        event={selectedEvent}
        defaultDate={newEventDate}
        onSave={loadEvents}
      />
    </DashboardLayout>
  );
}
