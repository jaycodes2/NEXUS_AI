import React from 'react';

interface TypingIndicatorProps {
    isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div
            className="flex gap-3 message-enter"
            role="status"
            aria-label="Assistant is typing"
        >
            {/* AI Avatar */}
            <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-gradient)' }}
            >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>

            {/* Typing Bubble */}
            <div
                className="backdrop-blur-sm px-5 py-4 rounded-2xl rounded-tl-md"
                style={{
                    backgroundColor: 'var(--bubble-assistant-bg)',
                    border: '1px solid var(--bubble-assistant-border)',
                }}
            >
                <div className="flex gap-1.5">
                    <div
                        className="w-2 h-2 rounded-full typing-dot"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                    <div
                        className="w-2 h-2 rounded-full typing-dot"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                    <div
                        className="w-2 h-2 rounded-full typing-dot"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                </div>
            </div>

            {/* Screen reader announcement */}
            <span className="sr-only">Assistant is typing</span>
        </div>
    );
};

export default TypingIndicator;
