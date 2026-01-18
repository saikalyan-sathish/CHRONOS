'use client';

import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  compact?: boolean;
}

export default function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const startTime = parseISO(event.start);
  const endTime = parseISO(event.end);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="px-2 py-1 text-xs font-medium rounded-md truncate cursor-pointer transition-all"
        style={{
          backgroundColor: `${event.color}20`,
          color: event.color,
          borderLeft: `3px solid ${event.color}`,
        }}
      >
        {event.title}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl cursor-pointer shadow-soft hover:shadow-lg transition-all bg-white dark:bg-dark-800"
      style={{
        borderLeft: `4px solid ${event.color}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: event.color }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <span>
            {event.allDay
              ? 'All day'
              : `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{event.location}</span>
          </div>
        )}
      </div>

      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {event.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-400 text-xs rounded-full">
              +{event.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {event.priority === 'high' && (
        <div className="mt-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            High Priority
          </span>
        </div>
      )}
    </motion.div>
  );
}
