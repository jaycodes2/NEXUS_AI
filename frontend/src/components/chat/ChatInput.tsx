import React, { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    disabled = false,
    placeholder = 'Message NEXUS AI...',
    maxLength = 4000,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { setEmojiPickerOpen } = useChatStore();
    const [showSlashCommands, setShowSlashCommands] = useState(false);

    // Slash commands
    const slashCommands = [
        { command: '/help', description: 'Show available commands' },
        { command: '/clear', description: 'Clear conversation' },
        { command: '/theme', description: 'Switch theme' },
        { command: '/export', description: 'Export chat history' },
    ];

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
        }
    }, [value]);

    // Show slash commands when typing /
    useEffect(() => {
        setShowSlashCommands(value.startsWith('/') && value.length < 15);
    }, [value]);

    // Handle key presses
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) {
                onSend();
            }
        }
    };

    // Handle slash command selection
    const selectSlashCommand = (command: string) => {
        onChange(command + ' ');
        setShowSlashCommands(false);
        textareaRef.current?.focus();
    };

    return (
        <div
            className="relative border-t px-4 sm:px-6 py-4 backdrop-blur-xl"
            style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-overlay)',
            }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Slash Commands Popup */}
                {showSlashCommands && (
                    <div
                        className="absolute bottom-full left-4 right-4 sm:left-6 sm:right-6 mb-2 rounded-xl overflow-hidden shadow-lg message-enter"
                        style={{
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                        }}
                        role="listbox"
                        aria-label="Slash commands"
                    >
                        {slashCommands
                            .filter(cmd => cmd.command.startsWith(value.toLowerCase()))
                            .map((cmd) => (
                                <button
                                    key={cmd.command}
                                    onClick={() => selectSlashCommand(cmd.command)}
                                    className="w-full px-4 py-3 flex items-center gap-3 transition-colors text-left"
                                    style={{
                                        color: 'var(--text-primary)',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-subtle)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    role="option"
                                >
                                    <span
                                        className="font-mono font-medium"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        {cmd.command}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>{cmd.description}</span>
                                </button>
                            ))}
                    </div>
                )}

                {/* Input Container */}
                <div className="relative group">
                    {/* Glow effect */}
                    <div
                        className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-40 transition-opacity duration-300"
                        style={{ background: 'var(--accent-gradient)' }}
                    />

                    <div
                        className="relative flex items-end gap-2 p-3 rounded-2xl backdrop-blur-sm"
                        style={{
                            backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--input-border)',
                        }}
                    >
                        {/* Attachment Button */}
                        <button
                            className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--bg-tertiary)',
                            }}
                            aria-label="Attach file"
                            title="Attach file"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        {/* Emoji Button */}
                        <button
                            onClick={() => setEmojiPickerOpen(true)}
                            className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--bg-tertiary)',
                            }}
                            aria-label="Insert emoji"
                            title="Insert emoji"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            data-chat-input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            rows={1}
                            maxLength={maxLength}
                            disabled={disabled}
                            className="flex-1 bg-transparent px-2 py-2 resize-none focus:outline-none max-h-40"
                            style={{
                                color: 'var(--text-primary)',
                            }}
                            aria-label="Message input"
                        />

                        {/* Voice Button */}
                        <button
                            className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--bg-tertiary)',
                            }}
                            aria-label="Voice input"
                            title="Voice input"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={onSend}
                            disabled={disabled || !value.trim()}
                            className="flex-shrink-0 p-2.5 rounded-xl font-medium transition-all duration-300"
                            style={{
                                background: !value.trim() || disabled ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
                                color: !value.trim() || disabled ? 'var(--text-muted)' : 'white',
                                cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
                                boxShadow: !value.trim() || disabled ? 'none' : 'var(--shadow-glow)',
                            }}
                            aria-label="Send message"
                        >
                            {disabled ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer hints */}
                <div
                    className="flex items-center justify-between mt-2 px-1 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Enter</kbd> to send ·
                        <kbd className="px-1.5 py-0.5 rounded font-mono ml-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Shift+Enter</kbd> for new line ·
                        <kbd className="px-1.5 py-0.5 rounded font-mono ml-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>/</kbd> for commands
                    </span>
                    <span>{value.length}/{maxLength}</span>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
