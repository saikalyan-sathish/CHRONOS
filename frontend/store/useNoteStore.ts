import { create } from 'zustand';
import { notesAPI } from '../lib/api';
import toast from 'react-hot-toast';

export interface Note {
    _id: string;
    title: string;
    content: string;
    color: string;
    coordinates: { x: number; y: number };
    pinnedDate: string | null;
    createdAt: string;
    updatedAt: string;
}

interface NoteState {
    notes: Note[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchNotes: () => Promise<void>;
    createNote: (data: Partial<Note>) => Promise<void>;
    updateNote: (id: string, data: Partial<Note>) => Promise<void>;
    updateCoordinates: (id: string, coordinates: { x: number; y: number }) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
    notes: [],
    isLoading: false,
    error: null,

    fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await notesAPI.getNotes();
            set({ notes: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            toast.error('Failed to load notes');
        }
    },

    createNote: async (data) => {
        try {
            const response = await notesAPI.createNote(data);
            set((state) => ({ notes: [response.data, ...state.notes] }));
        } catch (error: any) {
            toast.error('Failed to create note');
            throw error;
        }
    },

    updateNote: async (id, data) => {
        try {
            const response = await notesAPI.updateNote(id, data);
            set((state) => ({
                notes: state.notes.map((note) => (note._id === id ? response.data : note)),
            }));
        } catch (error: any) {
            toast.error('Failed to update note');
            throw error;
        }
    },

    updateCoordinates: async (id, coordinates) => {
        // Optimistic update
        set((state) => ({
            notes: state.notes.map((note) =>
                note._id === id ? { ...note, coordinates } : note
            ),
        }));

        try {
            await notesAPI.updateCoordinates(id, coordinates);
        } catch (error: any) {
            // Revert on failure by fetching again
            get().fetchNotes();
            toast.error('Failed to save note position');
        }
    },

    deleteNote: async (id) => {
        // Optimistic delete
        const previousNotes = get().notes;
        set((state) => ({
            notes: state.notes.filter((note) => note._id !== id),
        }));

        try {
            await notesAPI.deleteNote(id);
        } catch (error: any) {
            // Revert on failure
            set({ notes: previousNotes });
            toast.error('Failed to delete note');
            throw error;
        }
    },
}));
