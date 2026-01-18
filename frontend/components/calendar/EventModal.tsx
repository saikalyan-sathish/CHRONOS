'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { format, addHours } from 'date-fns';
import {
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  BellIcon,
  TagIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  BookmarkIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { eventsAPI, calendarsAPI, templatesAPI } from '@/lib/api';
import { useCalendarStore } from '@/store/useStore';
import type { Event, Calendar, EventTemplate } from '@/types';
import toast from 'react-hot-toast';
import TemplateManager from '@/components/templates/TemplateManager';
import TemplateModal from '@/components/templates/TemplateModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  defaultDate?: Date | null;
  onSave?: () => void;
}

const colorOptions = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-green-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'high', label: 'High', color: 'text-red-500' },
];

const reminderOptions = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSave,
}: EventModalProps) {
  const { calendars, setCalendars, addEvent, updateEvent, removeEvent } = useCalendarStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(colorOptions[0]);
  const [calendarId, setCalendarId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [reminderTime, setReminderTime] = useState(15);
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadCalendars();
  }, []);

  useEffect(() => {
    if (event) {
      // Editing existing event
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      const start = new Date(event.start);
      const end = new Date(event.end);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setAllDay(event.allDay);
      setColor(event.color);
      setCalendarId(typeof event.calendar === 'string' ? event.calendar : event.calendar._id);
      setPriority(event.priority);
      setReminderTime(event.reminders?.[0]?.time || 15);
      setTags(event.tags?.join(', ') || '');
    } else if (defaultDate) {
      // Creating new event
      const start = defaultDate;
      const end = addHours(start, 1);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      resetForm();
    } else {
      resetForm();
    }
  }, [event, defaultDate, isOpen]);

  const loadCalendars = async () => {
    try {
      const response = await calendarsAPI.getCalendars();
      setCalendars(response.data.calendars);
      if (response.data.calendars.length > 0 && !calendarId) {
        const defaultCal = response.data.calendars.find((c: Calendar) => c.isDefault);
        setCalendarId(defaultCal?._id || response.data.calendars[0]._id);
      }
    } catch (error) {
      console.error('Failed to load calendars:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setAllDay(false);
    setColor(colorOptions[0]);
    setPriority('medium');
    setReminderTime(15);
    setTags('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!calendarId) {
      toast.error('Please select a calendar');
      return;
    }

    setLoading(true);

    try {
      const start = new Date(`${startDate}T${allDay ? '00:00' : startTime}`);
      const end = new Date(`${endDate}T${allDay ? '23:59' : endTime}`);

      if (end <= start) {
        toast.error('End time must be after start time');
        setLoading(false);
        return;
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        allDay,
        color,
        calendar: calendarId,
        priority,
        reminders: [{ type: 'notification', time: reminderTime }],
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      if (event) {
        const response = await eventsAPI.updateEvent(event._id, eventData);
        updateEvent(event._id, response.data.event);
        toast.success('Event updated');
      } else {
        const response = await eventsAPI.createEvent(eventData);
        addEvent(response.data.event);
        toast.success('Event created');
      }

      onSave?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (!confirm('Are you sure you want to delete this event?')) return;

    setDeleting(true);

    try {
      await eventsAPI.deleteEvent(event._id);
      removeEvent(event._id);
      toast.success('Event deleted');
      onSave?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!event) return;

    try {
      const response = await eventsAPI.duplicateEvent(event._id);
      addEvent(response.data.event);
      toast.success('Event duplicated');
      onSave?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to duplicate event');
    }
  };

  const handleSelectTemplate = (template: EventTemplate) => {
    setTitle(template.title);
    setDescription(template.description || '');
    setLocation(template.location || '');
    setColor(template.color);
    setPriority(template.priority);
    if (template.reminders && template.reminders.length > 0) {
      setReminderTime(template.reminders[0]);
    }
    // Calculate end time based on template duration
    if (startDate && startTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(start.getTime() + template.duration * 60000);
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
    }
    setShowTemplateManager(false);
  };

  const getCurrentEventData = () => ({
    title,
    description,
    location,
    duration: (() => {
      if (startDate && startTime && endDate && endTime) {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        return Math.round((end.getTime() - start.getTime()) / 60000);
      }
      return 60;
    })(),
    color,
    priority,
    reminders: [reminderTime],
  });

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {event ? 'Edit Event' : 'New Event'}
                    </Dialog.Title>
                    <div className="flex items-center gap-2">
                      {!event && (
                        <button
                          onClick={() => setShowTemplateManager(true)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                          title="Use Template"
                        >
                          <RectangleStackIcon className="w-5 h-5 text-gray-500" />
                        </button>
                      )}
                      {title && (
                        <button
                          onClick={() => setShowSaveTemplate(true)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                          title="Save as Template"
                        >
                          <BookmarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                      )}
                      {event && (
                        <>
                          <button
                            onClick={handleDuplicate}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="w-5 h-5 text-gray-500" />
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Event title"
                      className="w-full text-xl font-semibold border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent text-gray-900 dark:text-white"
                      autoFocus
                    />

                    {/* Date & Time */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">All day</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pl-8">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Start
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input text-sm"
                            required
                          />
                          {!allDay && (
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="input text-sm mt-2"
                              required
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            End
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input text-sm"
                            required
                          />
                          {!allDay && (
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="input text-sm mt-2"
                              required
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Add location"
                        className="flex-1 input"
                      />
                    </div>

                    {/* Description */}
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add description"
                      rows={3}
                      className="input resize-none"
                    />

                    {/* Calendar & Color */}
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <select
                        value={calendarId}
                        onChange={(e) => setCalendarId(e.target.value)}
                        className="flex-1 input"
                      >
                        {calendars.map((cal) => (
                          <option key={cal._id} value={cal._id}>
                            {cal.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Color picker */}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex gap-2">
                        {colorOptions.map((c) => (
                          <motion.button
                            key={c}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                              }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-3">
                      <TagIcon className="w-5 h-5 text-gray-400" />
                      <div className="flex gap-2">
                        {priorityOptions.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setPriority(p.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${priority === p.value
                              ? `bg-gray-900 dark:bg-white text-white dark:text-gray-900`
                              : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reminder */}
                    <div className="flex items-center gap-3">
                      <BellIcon className="w-5 h-5 text-gray-400" />
                      <select
                        value={reminderTime}
                        onChange={(e) => setReminderTime(Number(e.target.value))}
                        className="input"
                      >
                        {reminderOptions.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-3">
                      <TagIcon className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Tags (comma separated)"
                        className="flex-1 input"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-primary"
                      >
                        {loading ? (
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : event ? (
                          'Update Event'
                        ) : (
                          'Create Event'
                        )}
                      </motion.button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateTemplate={() => {
          setShowTemplateManager(false);
          setShowSaveTemplate(true);
        }}
      />

      {/* Save as Template Modal */}
      <TemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        eventData={getCurrentEventData()}
        onSave={() => setShowSaveTemplate(false)}
      />
    </>
  );
}
