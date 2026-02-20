'use client';

import { useEffect, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    Modifier,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { PlusIcon } from '@heroicons/react/24/outline';
import StickyNote from '../../components/notes/StickyNote';
import NoteModal from '../../components/notes/NoteModal';
import { useNoteStore, Note } from '../../store/useNoteStore';
import { useRouter } from 'next/navigation';

export default function NotesPage() {
    const { notes, fetchNotes, updateCoordinates, deleteNote, createNote, updateNote } = useNoteStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, // minimum distance to drag, prevents conflicts with clicking
        },
    });

    const sensors = useSensors(pointerSensor);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const noteId = active.id as string;
        const note = notes.find((n) => n._id === noteId);

        if (note) {
            const newX = (note.coordinates?.x || 0) + delta.x;
            const newY = (note.coordinates?.y || 0) + delta.y;

            // Keep notes somewhat bounded (optional, but good UX)
            const boundedX = Math.max(0, newX);
            const boundedY = Math.max(0, newY);

            updateCoordinates(noteId, { x: boundedX, y: boundedY });
        }
    };

    const handleCreateOrUpdate = async (data: Partial<Note>) => {
        if (editingNote) {
            await updateNote(editingNote._id, data);
        } else {
            // Default creation coordinates in middle of screen approx
            await createNote({
                ...data,
                coordinates: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 }
            });
        }
        setEditingNote(null);
    };

    const handlePinToCalendar = (note: Note) => {
        // Navigate to calendar with query param to open pin modal
        // OR we could open a date picker here. Let's do a simple prompt for now, or just redirect
        // For simplicity, we can redirect to calendar view and let them handle it, 
        // or just directly update the API if we had a datepicker here.
        // Given the task, let's just alert for now, or use a basic browser prompt.
        const dateStr = prompt("Enter a date to pin (YYYY-MM-DD)", new Date().toISOString().split('T')[0]);
        if (dateStr) {
            const pinDate = new Date(dateStr);
            if (!isNaN(pinDate.getTime())) {
                updateNote(note._id, { pinnedDate: pinDate.toISOString() });
            }
        }
    };

    const handleConvertToTodo = (note: Note) => {
        // Navigate to todos page with the note data as params or use context
        // We will pass the title and content via URL query params
        const params = new URLSearchParams({
            title: note.title,
            description: note.content,
            fromNoteId: note._id
        });
        router.push(`/todos?${params.toString()}`);
    };

    return (
        <div className="h-[calc(100vh-4rem)] lg:h-screen bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] bg-white dark:bg-dark-900 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-[60]">
                <button
                    onClick={() => {
                        setEditingNote(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-lg transition-colors font-medium cursor-pointer"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Note
                </button>
            </div>

            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
            >
                <div className="w-full h-full relative">
                    {notes.map((note) => (
                        <StickyNote
                            key={note._id}
                            note={note}
                            onEdit={(n) => {
                                setEditingNote(n);
                                setIsModalOpen(true);
                            }}
                            onDelete={deleteNote}
                            onPinToCalendar={handlePinToCalendar}
                            onConvertToTodo={handleConvertToTodo}
                        />
                    ))}
                </div>
            </DndContext>

            <NoteModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingNote(null);
                }}
                onSave={handleCreateOrUpdate}
                initialData={editingNote}
            />
        </div>
    );
}
