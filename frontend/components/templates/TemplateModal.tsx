'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
    XMarkIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { templatesAPI } from '@/lib/api';
import type { EventTemplate } from '@/types';
import toast from 'react-hot-toast';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template?: EventTemplate | null;
    eventData?: {
        title: string;
        description?: string;
        location?: string;
        duration?: number;
        color?: string;
        category?: string;
        priority?: string;
        reminders?: number[];
    } | null;
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

const categoryOptions = [
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'health', label: 'Health' },
    { value: 'social', label: 'Social' },
    { value: 'other', label: 'Other' },
];

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
];

export default function TemplateModal({
    isOpen,
    onClose,
    template,
    eventData,
    onSave,
}: TemplateModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        location: '',
        duration: 60,
        color: '#3B82F6',
        category: 'other',
        priority: 'medium',
        isDefault: false,
    });

    const isEditing = !!template;

    useEffect(() => {
        if (template) {
            // Editing existing template
            setFormData({
                name: template.name,
                title: template.title,
                description: template.description || '',
                location: template.location || '',
                duration: template.duration,
                color: template.color,
                category: template.category,
                priority: template.priority,
                isDefault: template.isDefault,
            });
        } else if (eventData) {
            // Creating from event
            setFormData({
                name: '',
                title: eventData.title || '',
                description: eventData.description || '',
                location: eventData.location || '',
                duration: eventData.duration || 60,
                color: eventData.color || '#3B82F6',
                category: eventData.category || 'other',
                priority: eventData.priority || 'medium',
                isDefault: false,
            });
        } else {
            // Reset form
            setFormData({
                name: '',
                title: '',
                description: '',
                location: '',
                duration: 60,
                color: '#3B82F6',
                category: 'other',
                priority: 'medium',
                isDefault: false,
            });
        }
    }, [template, eventData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Template name is required');
            return;
        }
        if (!formData.title.trim()) {
            toast.error('Event title is required');
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing && template) {
                await templatesAPI.updateTemplate(template._id, formData);
                toast.success('Template updated');
            } else {
                await templatesAPI.createTemplate(formData);
                toast.success('Template created');
            }
            onSave?.();
            onClose();
        } catch (error: any) {
            console.error('Error saving template:', error);
            toast.error(error.response?.data?.message || 'Failed to save template');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle backdrop click - only close if explicitly clicking the backdrop
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {}} static>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick} />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4" onClick={handleBackdropClick}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white/90 dark:bg-dark-800/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-glass-lg transition-all" onClick={(e) => e.stopPropagation()}>
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                            <DocumentDuplicateIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {isEditing ? 'Edit Template' : 'Create Template'}
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {/* Template Name */}
                                    <div>
                                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Template Name *
                                        </label>
                                        <input
                                            id="template-name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Weekly Team Standup"
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Event Title */}
                                    <div>
                                        <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Event Title *
                                        </label>
                                        <input
                                            id="event-title"
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Team Standup"
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Optional description..."
                                            rows={3}
                                            className="input"
                                        />
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Location
                                        </label>
                                        <input
                                            id="location"
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g., Conference Room A"
                                            className="input"
                                        />
                                    </div>

                                    {/* Duration & Category Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Duration
                                            </label>
                                            <select
                                                id="duration"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                                className="input"
                                            >
                                                {durationOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Category
                                            </label>
                                            <select
                                                id="category"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="input"
                                            >
                                                {categoryOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Priority */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Priority
                                        </label>
                                        <div className="flex gap-2">
                                            {priorityOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, priority: option.value })}
                                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.priority === option.value
                                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 ring-2 ring-primary-500'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Color
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color })}
                                                    className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-105'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                    aria-label={`Select color ${color}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Default checkbox */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="is-default"
                                            type="checkbox"
                                            checked={formData.isDefault}
                                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor="is-default" className="text-sm text-gray-700 dark:text-gray-300">
                                            Set as default template
                                        </label>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10 dark:border-white/5">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="btn btn-primary flex items-center gap-2"
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : null}
                                            {isEditing ? 'Update Template' : 'Create Template'}
                                        </button>
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
