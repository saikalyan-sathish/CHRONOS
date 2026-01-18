'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { todosAPI } from '@/lib/api';
import { useTodoStore } from '@/store/useStore';
import type { Todo } from '@/types';
import toast from 'react-hot-toast';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo?: Todo | null;
  onSave?: () => void;
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const quickDates = [
  { label: 'Today', getValue: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Tomorrow', getValue: () => format(addDays(new Date(), 1), 'yyyy-MM-dd') },
  { label: 'Next Week', getValue: () => format(addDays(new Date(), 7), 'yyyy-MM-dd') },
];

export default function TodoModal({ isOpen, onClose, todo, onSave }: TodoModalProps) {
  const { addTodo, updateTodo, removeTodo } = useTodoStore();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [list, setList] = useState('inbox');
  const [tags, setTags] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ title: string; completed: boolean }>>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setDueDate(todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '');
      setDueTime(todo.dueTime || '');
      setList(todo.list);
      setTags(todo.tags?.join(', ') || '');
      setSubtasks(todo.subtasks || []);
      setEstimatedTime(todo.estimatedTime || 30);
    } else {
      resetForm();
    }
  }, [todo, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setDueTime('');
    setList('inbox');
    setTags('');
    setSubtasks([]);
    setNewSubtask('');
    setEstimatedTime(30);
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { title: newSubtask.trim(), completed: false }]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);

    try {
      const todoData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        list,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        subtasks,
        estimatedTime,
      };

      if (todo) {
        const response = await todosAPI.updateTodo(todo._id, todoData);
        updateTodo(todo._id, response.data.todo);
        toast.success('Task updated');
      } else {
        const response = await todosAPI.createTodo(todoData);
        addTodo(response.data.todo);
        toast.success('Task created');
      }

      onSave?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await todosAPI.deleteTodo(todo._id);
      removeTodo(todo._id);
      toast.success('Task deleted');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
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
                    {todo ? 'Edit Task' : 'New Task'}
                  </Dialog.Title>
                  <div className="flex items-center gap-2">
                    {todo && (
                      <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </button>
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
                    placeholder="Task title"
                    className="w-full text-xl font-semibold border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent text-gray-900 dark:text-white"
                    autoFocus
                  />

                  {/* Description */}
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add description..."
                    rows={2}
                    className="input resize-none"
                  />

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {priorityOptions.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            priority === p.value
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${p.color}`} />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Due date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <div className="flex gap-2 mb-2">
                      {quickDates.map((qd) => (
                        <button
                          key={qd.label}
                          type="button"
                          onClick={() => setDueDate(qd.getValue())}
                          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                        >
                          {qd.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="input text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <input
                          type="time"
                          value={dueTime}
                          onChange={(e) => setDueTime(e.target.value)}
                          className="input text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      List
                    </label>
                    <input
                      type="text"
                      value={list}
                      onChange={(e) => setList(e.target.value)}
                      className="input flex-1"
                      placeholder="inbox"
                    />
                  </div>

                  {/* Estimated time */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estimated time
                    </label>
                    <select
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(Number(e.target.value))}
                      className="input"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={180}>3 hours</option>
                      <option value={240}>4+ hours</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-3">
                    <TagIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="input flex-1"
                      placeholder="Tags (comma separated)"
                    />
                  </div>

                  {/* Subtasks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subtasks
                    </label>
                    <div className="space-y-2 mb-3">
                      {subtasks.map((subtask, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-dark-700 rounded-lg"
                        >
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {subtask.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(index)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-600"
                          >
                            <XMarkIcon className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask();
                          }
                        }}
                        className="input flex-1 text-sm"
                        placeholder="Add a subtask..."
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="btn btn-secondary"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="btn btn-secondary">
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
                      ) : todo ? (
                        'Update Task'
                      ) : (
                        'Create Task'
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
  );
}
