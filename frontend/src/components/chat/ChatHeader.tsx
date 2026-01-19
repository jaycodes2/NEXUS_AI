import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useChatStore } from '../../stores/chatStore';

interface ChatHeaderProps {
    title?: string;
    subtitle?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    title = 'NEXUS AI',
    subtitle = 'Always ready to assist',
}) => {
    const { cycleTheme, getThemeIcon, getThemeLabel } = useTheme();
    const { toggleCommandPalette } = useChatStore();

    return (
        <header
            className="relative border-b px-6 py-4 sticky top-0 backdrop-blur-xl z-20"
            style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--bg-overlay)',
            }}
            role="banner"
        >
            <div className="flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: 'var(--accent-gradient)' }}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        {/* Online indicator */}
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 animate-pulse"
                            style={{
                                backgroundColor: 'var(--success)',
                                borderColor: 'var(--bg-primary)',
                            }}
                            aria-label="Online"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold gradient-text">{title}</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={cycleTheme}
                        className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-default)',
                        }}
                        aria-label={`Switch theme. Current: ${getThemeLabel()}`}
                        title={`Theme: ${getThemeLabel()}`}
                    >
                        <span className="text-lg" role="img" aria-hidden="true">
                            {getThemeIcon()}
                        </span>
                    </button>

                    {/* Command Palette */}
                    <button
                        onClick={toggleCommandPalette}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 focus-ring"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)',
                        }}
                        aria-label="Open command palette"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-xs font-medium">⌘K</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
