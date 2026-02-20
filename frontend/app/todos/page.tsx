'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TodoModal from '@/components/todos/TodoModal';
import { useTodoStore, useUIStore } from '@/store/useStore';
import { todosAPI } from '@/lib/api';
import type { Todo } from '@/types';
import toast from 'react-hot-toast';

const priorityColors = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusFilters = [
  { value: 'all', label: 'All Tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function TodosPage() {
  const { todos, setTodos, updateTodo, removeTodo, selectedTodo, setSelectedTodo, currentList, setCurrentList } = useTodoStore();
  const { todoModalOpen, setTodoModalOpen } = useUIStore();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lists, setLists] = useState<string[]>(['inbox']);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });

  useEffect(() => {
    // Check for "Convert to Todo" params from Sticky Notes
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    if (title && !todoModalOpen) {
      setSelectedTodo({ title, description, priority: 'medium', status: 'pending', list: 'inbox', subtasks: [] } as unknown as Todo);
      setTodoModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTodos();
    loadLists();
    loadStats();
  }, [statusFilter, currentList]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (currentList !== 'all') {
        params.list = currentList;
      }
      const response = await todosAPI.getTodos(params);
      setTodos(response.data.todos);
    } catch (error) {
      console.error('Failed to load todos:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async () => {
    try {
      const response = await todosAPI.getLists();
      setLists(['all', ...response.data.lists]);
    } catch (error) {
      console.error('Failed to load lists:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await todosAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      await todosAPI.updateTodo(todo._id, { status: newStatus });
      updateTodo(todo._id, { status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined });
      loadStats();
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await todosAPI.deleteTodo(id);
      removeTodo(id);
      loadStats();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = (todo: Todo) => {
    setSelectedTodo(todo);
    setTodoModalOpen(true);
  };

  const filteredTodos = todos.filter((todo) =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDueDateLabel = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isToday(date)) return { text: 'Today', color: 'text-blue-600 dark:text-blue-400' };
    if (isTomorrow(date)) return { text: 'Tomorrow', color: 'text-green-600 dark:text-green-400' };
    if (isPast(date)) return { text: 'Overdue', color: 'text-red-600 dark:text-red-400' };
    return { text: format(date, 'MMM d'), color: 'text-gray-500 dark:text-gray-400' };
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {stats.completed} of {stats.total} tasks completed
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedTodo(null);
              setTodoModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Task
          </motion.button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: CheckCircleIcon, color: 'bg-blue-500' },
            { label: 'Completed', value: stats.completed, icon: CheckCircleSolidIcon, color: 'bg-green-500' },
            { label: 'Pending', value: stats.pending, icon: ClockIcon, color: 'bg-yellow-500' },
            { label: 'Overdue', value: stats.overdue, icon: CalendarIcon, color: 'bg-red-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === filter.value
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'bg-white/50 dark:bg-dark-700/50 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-dark-600/70 border border-white/20 dark:border-white/5'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lists sidebar & todos */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Lists */}
          <div className="lg:w-48 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {lists.map((list) => (
              <button
                key={list}
                onClick={() => setCurrentList(list)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${currentList === list
                    ? 'bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl shadow-glass text-primary-600 dark:text-primary-400 border border-white/20 dark:border-white/5'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-dark-800/50 backdrop-blur-sm'
                  }`}
              >
                {list === 'all' ? 'All Lists' : list.charAt(0).toUpperCase() + list.slice(1)}
              </button>
            ))}
          </div>

          {/* Todo list */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"
                />
              </div>
            ) : filteredTodos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <CheckCircleIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
                </p>
                <button
                  onClick={() => {
                    setSelectedTodo(null);
                    setTodoModalOpen(true);
                  }}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Task
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTodos.map((todo, index) => {
                    const dueDateLabel = getDueDateLabel(todo.dueDate);
                    return (
                      <motion.div
                        key={todo._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className={`card p-4 group hover:shadow-lg transition-all ${todo.status === 'completed' ? 'opacity-60' : ''
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleComplete(todo)}
                            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.status === 'completed'
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                              }`}
                          >
                            {todo.status === 'completed' && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </motion.svg>
                            )}
                          </motion.button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`font-medium text-gray-900 dark:text-white ${todo.status === 'completed' ? 'line-through text-gray-400' : ''
                                  }`}
                              >
                                {todo.title}
                              </h4>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(todo)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                  <PencilIcon className="w-4 h-4 text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleDelete(todo._id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <TrashIcon className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>

                            {todo.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {todo.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {/* Priority badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[todo.priority]
                                  }`}
                              >
                                {todo.priority}
                              </span>

                              {/* Due date */}
                              {dueDateLabel && (
                                <span className={`text-xs font-medium ${dueDateLabel.color}`}>
                                  {dueDateLabel.text}
                                </span>
                              )}

                              {/* List */}
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                in {todo.list}
                              </span>

                              {/* Subtasks progress */}
                              {todo.subtasks && todo.subtasks.length > 0 && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length} subtasks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subtasks */}
                        {todo.subtasks && todo.subtasks.length > 0 && (
                          <div className="mt-3 ml-10 space-y-2">
                            {todo.subtasks.slice(0, 3).map((subtask, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 text-sm ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-600 dark:text-gray-400'
                                  }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${subtask.completed
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                  {subtask.completed && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                                {subtask.title}
                              </div>
                            ))}
                            {todo.subtasks.length > 3 && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                +{todo.subtasks.length - 3} more subtasks
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Todo Modal */}
      <TodoModal
        isOpen={todoModalOpen}
        onClose={() => {
          setTodoModalOpen(false);
          setSelectedTodo(null);
        }}
        todo={selectedTodo}
        onSave={() => {
          loadTodos();
          loadStats();
        }}
      />
    </DashboardLayout>
  );
}
