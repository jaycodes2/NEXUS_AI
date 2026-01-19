import { useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardNav() {
    const {
        toggleCommandPalette,
        setCommandPaletteOpen,
        isCommandPaletteOpen
    } = useChatStore();

    // Define keyboard shortcuts
    const shortcuts: KeyboardShortcut[] = [
        {
            key: 'k',
            meta: true, // ⌘K on Mac
            ctrl: true, // Ctrl+K on Windows
            action: toggleCommandPalette,
            description: 'Open command palette',
        },
        {
            key: 'Escape',
            action: () => setCommandPaletteOpen(false),
            description: 'Close modals',
        },
        {
            key: '/',
            meta: true,
            ctrl: true,
            action: () => {
                const input = document.querySelector('textarea[data-chat-input]') as HTMLTextAreaElement;
                input?.focus();
            },
            description: 'Focus message input',
        },
    ];

    // Handle keydown
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Skip if typing in an input
        const target = event.target as HTMLElement;
        const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName) &&
            event.key !== 'Escape' &&
            !(event.key === 'k' && (event.metaKey || event.ctrlKey));

        if (isTyping) return;

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const metaMatch = !shortcut.meta || event.metaKey;
            const ctrlMatch = !shortcut.ctrl || event.ctrlKey;
            const shiftMatch = !shortcut.shift || event.shiftKey;
            const altMatch = !shortcut.alt || event.altKey;

            // Handle both Ctrl and Meta for cross-platform
            const modifierMatch = shortcut.meta || shortcut.ctrl
                ? (event.metaKey || event.ctrlKey)
                : true;

            if (keyMatch && modifierMatch && shiftMatch && altMatch) {
                event.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts]);

    // Attach listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return {
        shortcuts,
        isCommandPaletteOpen,
    };
}

export default useKeyboardNav;
