'use client';

import { useCallback, useEffect } from 'react';
import { useHistoryStore, ActionType } from '@/store/useHistoryStore';
import { eventsAPI, todosAPI } from '@/lib/api';
import { useCalendarStore, useTodoStore } from '@/store/useStore';
import toast from 'react-hot-toast';

/**
 * Hook for managing undo/redo operations with keyboard shortcuts
 */
export function useUndoRedo() {
    const {
        undo,
        redo,
        canUndo,
        canRedo,
        getUndoDescription,
        getRedoDescription,
        pushAction,
    } = useHistoryStore();

    const { addEvent, updateEvent, removeEvent } = useCalendarStore();
    const { addTodo, updateTodo, removeTodo } = useTodoStore();

    // Execute undo action
    const executeUndo = useCallback(async () => {
        const action = undo();
        if (!action) return;

        try {
            switch (action.type) {
                case 'CREATE_EVENT':
                    // Undo create = delete the event
                    await eventsAPI.deleteEvent(action.currentData._id);
                    removeEvent(action.currentData._id);
                    toast.success('Undo: Event removed');
                    break;

                case 'UPDATE_EVENT':
                    // Undo update = restore previous data
                    await eventsAPI.updateEvent(action.previousData._id, action.previousData);
                    updateEvent(action.previousData._id, action.previousData);
                    toast.success('Undo: Event restored');
                    break;

                case 'DELETE_EVENT':
                    // Undo delete = recreate the event
                    const eventResponse = await eventsAPI.createEvent(action.previousData);
                    addEvent(eventResponse.data.event);
                    toast.success('Undo: Event restored');
                    break;

                case 'CREATE_TODO':
                    // Undo create = delete the todo
                    await todosAPI.deleteTodo(action.currentData._id);
                    removeTodo(action.currentData._id);
                    toast.success('Undo: Todo removed');
                    break;

                case 'UPDATE_TODO':
                    // Undo update = restore previous data
                    await todosAPI.updateTodo(action.previousData._id, action.previousData);
                    updateTodo(action.previousData._id, action.previousData);
                    toast.success('Undo: Todo restored');
                    break;

                case 'DELETE_TODO':
                    // Undo delete = recreate the todo
                    const todoResponse = await todosAPI.createTodo(action.previousData);
                    addTodo(todoResponse.data.todo);
                    toast.success('Undo: Todo restored');
                    break;

                case 'BULK_DELETE_TODOS':
                    // Undo bulk delete = recreate all todos
                    for (const todo of action.previousData) {
                        const response = await todosAPI.createTodo(todo);
                        addTodo(response.data.todo);
                    }
                    toast.success(`Undo: ${action.previousData.length} todos restored`);
                    break;
            }
        } catch (error) {
            console.error('Undo failed:', error);
            toast.error('Failed to undo action');
        }
    }, [undo, removeEvent, updateEvent, addEvent, removeTodo, updateTodo, addTodo]);

    // Execute redo action
    const executeRedo = useCallback(async () => {
        const action = redo();
        if (!action) return;

        try {
            switch (action.type) {
                case 'CREATE_EVENT':
                    // Redo create = create the event again
                    const eventCreateResponse = await eventsAPI.createEvent(action.currentData);
                    addEvent(eventCreateResponse.data.event);
                    toast.success('Redo: Event created');
                    break;

                case 'UPDATE_EVENT':
                    // Redo update = apply current data
                    await eventsAPI.updateEvent(action.currentData._id, action.currentData);
                    updateEvent(action.currentData._id, action.currentData);
                    toast.success('Redo: Event updated');
                    break;

                case 'DELETE_EVENT':
                    // Redo delete = delete the event again
                    await eventsAPI.deleteEvent(action.previousData._id);
                    removeEvent(action.previousData._id);
                    toast.success('Redo: Event deleted');
                    break;

                case 'CREATE_TODO':
                    // Redo create = create the todo again
                    const todoCreateResponse = await todosAPI.createTodo(action.currentData);
                    addTodo(todoCreateResponse.data.todo);
                    toast.success('Redo: Todo created');
                    break;

                case 'UPDATE_TODO':
                    // Redo update = apply current data
                    await todosAPI.updateTodo(action.currentData._id, action.currentData);
                    updateTodo(action.currentData._id, action.currentData);
                    toast.success('Redo: Todo updated');
                    break;

                case 'DELETE_TODO':
                    // Redo delete = delete the todo again
                    await todosAPI.deleteTodo(action.previousData._id);
                    removeTodo(action.previousData._id);
                    toast.success('Redo: Todo deleted');
                    break;

                case 'BULK_DELETE_TODOS':
                    // Redo bulk delete = delete all todos again
                    for (const todo of action.previousData) {
                        await todosAPI.deleteTodo(todo._id);
                        removeTodo(todo._id);
                    }
                    toast.success(`Redo: ${action.previousData.length} todos deleted`);
                    break;
            }
        } catch (error) {
            console.error('Redo failed:', error);
            toast.error('Failed to redo action');
        }
    }, [redo, addEvent, updateEvent, removeEvent, addTodo, updateTodo, removeTodo]);

    // Setup keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                executeUndo();
            }

            // Ctrl/Cmd + Shift + Z = Redo (or Ctrl/Cmd + Y)
            if (
                ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
                ((e.ctrlKey || e.metaKey) && e.key === 'y')
            ) {
                e.preventDefault();
                executeRedo();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [executeUndo, executeRedo]);

    // Helper to record an action
    const recordAction = useCallback(
        (
            type: ActionType,
            previousData: any,
            currentData: any,
            description: string
        ) => {
            pushAction({ type, previousData, currentData, description });
        },
        [pushAction]
    );

    return {
        executeUndo,
        executeRedo,
        canUndo: canUndo(),
        canRedo: canRedo(),
        undoDescription: getUndoDescription(),
        redoDescription: getRedoDescription(),
        recordAction,
    };
}
