'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    XMarkIcon,
    DocumentDuplicateIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { templatesAPI } from '@/lib/api';
import type { EventTemplate } from '@/types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: EventTemplate) => void;
    onCreateTemplate?: () => void;
}

const categoryColors: Record<string, string> = {
    work: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    health: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    social: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function TemplateManager({
    isOpen,
    onClose,
    onSelectTemplate,
    onCreateTemplate,
}: TemplateManagerProps) {
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('usage');

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen, sortBy]);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await templatesAPI.getTemplates({
                sort: sortBy,
                order: sortBy === 'name' ? 'asc' : 'desc',
            });
            setTemplates(response.data);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTemplate = async (template: EventTemplate) => {
        try {
            // Increment usage count
            await templatesAPI.useTemplate(template._id);
            onSelectTemplate(template);
            onClose();
            toast.success(`Template "${template.name}" applied`);
        } catch (error) {
            console.error('Error using template:', error);
            // Still select the template even if usage count update fails
            onSelectTemplate(template);
            onClose();
        }
    };

    const handleDeleteTemplate = async (template: EventTemplate) => {
        if (!confirm(`Delete template "${template.name}"?`)) return;

        try {
            await templatesAPI.deleteTemplate(template._id);
            setTemplates((prev) => prev.filter((t) => t._id !== template._id));
            toast.success('Template deleted');
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    const filteredTemplates = templates.filter((template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
                                    <div>
                                        <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                                            Event Templates
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Select a template to quickly create an event
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                        aria-label="Close templates"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Search and Sort */}
                                <div className="p-4 border-b border-gray-200 dark:border-dark-700 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Search templates..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
                                        {(['usage', 'name', 'recent'] as const).map((sort) => (
                                            <button
                                                key={sort}
                                                onClick={() => setSortBy(sort)}
                                                className={`px-3 py-1 text-sm rounded-full transition-colors ${sortBy === sort
                                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600'
                                                    }`}
                                            >
                                                {sort === 'usage' ? 'Most Used' : sort === 'name' ? 'Name' : 'Recent'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Templates List */}
                                <div className="p-4 max-h-96 overflow-y-auto">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : filteredTemplates.length === 0 ? (
                                        <div className="text-center py-12">
                                            <DocumentDuplicateIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {searchQuery ? 'No templates match your search' : 'No templates yet'}
                                            </p>
                                            {onCreateTemplate && !searchQuery && (
                                                <button
                                                    onClick={onCreateTemplate}
                                                    className="mt-4 btn btn-primary"
                                                >
                                                    Create Your First Template
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            <div className="space-y-2">
                                                {filteredTemplates.map((template, index) => (
                                                    <motion.div
                                                        key={template._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group relative flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-all cursor-pointer"
                                                        onClick={() => handleSelectTemplate(template)}
                                                    >
                                                        {/* Color indicator */}
                                                        <div
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: template.color }}
                                                        />

                                                        {/* Template info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                                    {template.name}
                                                                </h3>
                                                                {template.isDefault && (
                                                                    <StarIcon className="w-4 h-4 text-yellow-500" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                {template.title}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[template.category]}`}>
                                                                    {template.category}
                                                                </span>
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {formatDuration(template.duration)}
                                                                </span>
                                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                    Used {template.usageCount}x
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTemplate(template);
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors"
                                                                aria-label={`Delete template ${template.name}`}
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </AnimatePresence>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {templates.length} template{templates.length !== 1 ? 's' : ''}
                                    </span>
                                    {onCreateTemplate && (
                                        <button
                                            onClick={onCreateTemplate}
                                            className="btn btn-primary flex items-center gap-2"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            New Template
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
