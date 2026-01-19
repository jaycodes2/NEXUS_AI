import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useTheme } from '../../hooks/useTheme';

interface Command {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
}

export const CommandPalette: React.FC = () => {
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useChatStore();
    const { cycleTheme, getThemeLabel } = useTheme();
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Define commands
    const commands: Command[] = [
        {
            id: 'new-chat',
            label: 'New Chat',
            description: 'Start a fresh conversation',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            shortcut: '⌘N',
            action: () => {
                localStorage.removeItem('threadId');
                window.location.reload();
            },
        },
        {
            id: 'theme',
            label: `Switch Theme (${getThemeLabel()})`,
            description: 'Toggle between light, dark, OLED, and high-contrast',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            ),
            shortcut: '⌘T',
            action: () => {
                cycleTheme();
                setCommandPaletteOpen(false);
            },
        },
        {
            id: 'clear',
            label: 'Clear Conversation',
            description: 'Remove all messages from current thread',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            action: () => {
                // Will be connected to actual clear logic
                setCommandPaletteOpen(false);
            },
        },
        {
            id: 'export',
            label: 'Export Chat',
            description: 'Download conversation as markdown',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            ),
            action: () => {
                // Export logic
                setCommandPaletteOpen(false);
            },
        },
        {
            id: 'focus-input',
            label: 'Focus Input',
            description: 'Jump to message input',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            ),
            shortcut: '⌘/',
            action: () => {
                const input = document.querySelector('textarea[data-chat-input]') as HTMLTextAreaElement;
                input?.focus();
                setCommandPaletteOpen(false);
            },
        },
        {
            id: 'shortcuts',
            label: 'Keyboard Shortcuts',
            description: 'View all available shortcuts',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            ),
            shortcut: '?',
            action: () => {
                // Show shortcuts modal
                setCommandPaletteOpen(false);
            },
        },
    ];

    // Filter commands based on search
    const filteredCommands = commands.filter(
        (cmd) =>
            cmd.label.toLowerCase().includes(search.toLowerCase()) ||
            cmd.description.toLowerCase().includes(search.toLowerCase())
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isCommandPaletteOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((i) => (i + 1) % filteredCommands.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    filteredCommands[selectedIndex]?.action();
                    break;
                case 'Escape':
                    e.preventDefault();
                    setCommandPaletteOpen(false);
                    break;
            }
        },
        [isCommandPaletteOpen, filteredCommands, selectedIndex, setCommandPaletteOpen]
    );

    // Focus input on open
    useEffect(() => {
        if (isCommandPaletteOpen) {
            inputRef.current?.focus();
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isCommandPaletteOpen]);

    // Keyboard listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    if (!isCommandPaletteOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50"
                style={{ backgroundColor: 'var(--bg-overlay)' }}
                onClick={() => setCommandPaletteOpen(false)}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 message-enter"
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
            >
                <div
                    className="rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                    }}
                >
                    {/* Search Input */}
                    <div
                        className="flex items-center gap-3 px-4 py-4 border-b"
                        style={{ borderColor: 'var(--border-default)' }}
                    >
                        <svg
                            className="w-5 h-5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent focus:outline-none"
                            style={{ color: 'var(--text-primary)' }}
                            aria-label="Search commands"
                        />
                        <kbd
                            className="px-2 py-1 rounded text-xs font-mono"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            ESC
                        </kbd>
                    </div>

                    {/* Commands List */}
                    <div className="max-h-80 overflow-y-auto py-2" role="listbox">
                        {filteredCommands.length === 0 ? (
                            <div
                                className="px-4 py-8 text-center"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                No commands found
                            </div>
                        ) : (
                            filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    onClick={cmd.action}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className="w-full px-4 py-3 flex items-center gap-4 transition-colors"
                                    style={{
                                        backgroundColor: index === selectedIndex ? 'var(--accent-subtle)' : 'transparent',
                                        color: 'var(--text-primary)',
                                    }}
                                    role="option"
                                    aria-selected={index === selectedIndex}
                                >
                                    <span style={{ color: 'var(--accent-primary)' }}>{cmd.icon}</span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium">{cmd.label}</div>
                                        <div
                                            className="text-sm"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {cmd.description}
                                        </div>
                                    </div>
                                    {cmd.shortcut && (
                                        <kbd
                                            className="px-2 py-1 rounded text-xs font-mono"
                                            style={{
                                                backgroundColor: 'var(--bg-tertiary)',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            {cmd.shortcut}
                                        </kbd>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="flex items-center gap-4 px-4 py-3 text-xs border-t"
                        style={{
                            borderColor: 'var(--border-default)',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-tertiary)' }}>↑</kbd>
                            <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-tertiary)' }}>↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-tertiary)' }}>↵</kbd>
                            to select
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommandPalette;
