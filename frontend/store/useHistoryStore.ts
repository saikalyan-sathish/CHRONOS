'use client';

import { create } from 'zustand';

/**
 * Types for history actions
 */
export type ActionType =
    | 'CREATE_EVENT'
    | 'UPDATE_EVENT'
    | 'DELETE_EVENT'
    | 'CREATE_TODO'
    | 'UPDATE_TODO'
    | 'DELETE_TODO'
    | 'BULK_DELETE_TODOS';

interface HistoryAction {
    id: string;
    type: ActionType;
    timestamp: number;
    // Data before the action (for undo)
    previousData: any;
    // Data after the action (for redo)
    currentData: any;
    // Description for UI
    description: string;
}

interface HistoryState {
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];
    maxHistorySize: number;

    // Add an action to history
    pushAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;

    // Undo the last action
    undo: () => HistoryAction | null;

    // Redo the last undone action
    redo: () => HistoryAction | null;

    // Check if undo/redo is available
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Get the last action description
    getUndoDescription: () => string | null;
    getRedoDescription: () => string | null;

    // Clear history
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,

    pushAction: (action) => {
        const newAction: HistoryAction = {
            ...action,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
        };

        set((state) => ({
            undoStack: [newAction, ...state.undoStack].slice(0, state.maxHistorySize),
            // Clear redo stack when new action is pushed
            redoStack: [],
        }));
    },

    undo: () => {
        const { undoStack, redoStack } = get();
        if (undoStack.length === 0) return null;

        const [actionToUndo, ...remainingUndo] = undoStack;

        set({
            undoStack: remainingUndo,
            redoStack: [actionToUndo, ...redoStack],
        });

        return actionToUndo;
    },

    redo: () => {
        const { undoStack, redoStack } = get();
        if (redoStack.length === 0) return null;

        const [actionToRedo, ...remainingRedo] = redoStack;

        set({
            undoStack: [actionToRedo, ...undoStack],
            redoStack: remainingRedo,
        });

        return actionToRedo;
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    getUndoDescription: () => {
        const { undoStack } = get();
        return undoStack.length > 0 ? undoStack[0].description : null;
    },

    getRedoDescription: () => {
        const { redoStack } = get();
        return redoStack.length > 0 ? redoStack[0].description : null;
    },

    clearHistory: () => set({ undoStack: [], redoStack: [] }),
}));
