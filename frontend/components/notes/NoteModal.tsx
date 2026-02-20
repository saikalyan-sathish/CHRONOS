'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Note } from '../../store/useNoteStore';

const COLORS = [
    'bg-yellow-100',
    'bg-green-100',
    'bg-blue-100',
    'bg-pink-100',
    'bg-purple-100',
    'bg-orange-100',
    'bg-gray-100',
];

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Note>) => void;
    initialData?: Note | null;
}

export default function NoteModal({ isOpen, onClose, onSave, initialData }: NoteModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState(COLORS[0]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setContent(initialData.content || '');
                setColor(initialData.color || COLORS[0]);
            } else {
                setTitle('');
                setContent('');
                setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, content, color });
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className={`relative transform overflow-hidden rounded-xl text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${color}`}>
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white/20 text-gray-800 hover:bg-white/40 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6">
                                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-4">
                                        {initialData ? 'Edit Note' : 'New Note'}
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                                Title
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-white/50"
                                                placeholder="Note title"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                                Content (Markdown supported)
                                            </label>
                                            <textarea
                                                id="content"
                                                name="content"
                                                rows={6}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 bg-white/50"
                                                placeholder="Type your note here..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Color
                                            </label>
                                            <div className="flex gap-2">
                                                {COLORS.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setColor(c)}
                                                        className={`w-8 h-8 rounded-full border-2 ${c} ${color === c ? 'border-gray-800' : 'border-transparent hover:border-gray-400'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            className="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white/50 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-white/80 sm:mt-0 sm:w-auto"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
