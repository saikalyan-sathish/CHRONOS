'use client';

import { useDraggable } from '@dnd-kit/core';
import { PencilIcon, TrashIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../../store/useNoteStore';
import { format } from 'date-fns';

interface StickyNoteProps {
    note: Note;
    onEdit: (note: Note) => void;
    onDelete: (id: string) => void;
    onPinToCalendar: (note: Note) => void;
    onConvertToTodo: (note: Note) => void;
}

export default function StickyNote({ note, onEdit, onDelete, onPinToCalendar, onConvertToTodo }: StickyNoteProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: note._id,
        data: note,
    });

    const style = {
        // We apply the backend coordinates as base, then apply the transform diff while dragging
        transform: transform
            ? `translate3d(${note.coordinates?.x + transform.x}px, ${note.coordinates?.y + transform.y}px, 0)`
            : `translate3d(${note.coordinates?.x || 0}px, ${note.coordinates?.y || 0}px, 0)`,
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`absolute w-64 p-4 shadow-lg rounded-md border text-gray-800 ${note.color} ${isDragging ? 'shadow-2xl cursor-grabbing' : 'cursor-grab'} transition-shadow flex flex-col`}
        >
            {/* Drag handle area */}
            <div
                {...listeners}
                {...attributes}
                className="h-6 -mt-2 -mx-2 mb-2 cursor-[inherit] bg-white/10 hover:bg-white/20 rounded-t-md transition-colors"
            />

            <div className="flex justify-between items-start mb-2 group">
                <h3 className="font-semibold text-sm line-clamp-2 pr-2">{note.title}</h3>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(note)} className="p-1 hover:bg-black/10 rounded">
                        <PencilIcon className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(note._id)} className="p-1 hover:bg-black/10 rounded text-red-600">
                        <TrashIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="flex-grow text-xs prose prose-sm prose-p:leading-snug max-w-none overflow-hidden hover:overflow-y-auto mb-2 custom-scrollbar" style={{ maxHeight: '150px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content || '*Empty note*'}
                </ReactMarkdown>
            </div>

            <div className="pt-2 border-t border-black/10 flex justify-between items-center text-[10px] text-gray-600">
                <div>
                    {note.pinnedDate ? (
                        <span className="flex items-center text-blue-600">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(new Date(note.pinnedDate), 'MMM d')}
                        </span>
                    ) : (
                        format(new Date(note.createdAt), 'MMM d, h:mm a')
                    )}
                </div>
                <div className="flex space-x-1">
                    <button
                        onClick={() => onConvertToTodo(note)}
                        title="Convert to Todo"
                        className="p-1 hover:bg-black/10 rounded"
                    >
                        <CheckCircleIcon className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => onPinToCalendar(note)}
                        title={note.pinnedDate ? "Change pinned date" : "Pin to Calendar"}
                        className="p-1 hover:bg-black/10 rounded"
                    >
                        <CalendarIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
