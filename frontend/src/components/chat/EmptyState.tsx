import React from 'react';

export const EmptyState: React.FC = () => {
    const suggestions = [
        { icon: '💡', text: 'Explain a complex concept' },
        { icon: '🔧', text: 'Help me debug my code' },
        { icon: '📝', text: 'Write documentation' },
        { icon: '🎨', text: 'Generate creative ideas' },
    ];

    return (
        <div
            className="flex flex-col items-center justify-center h-full text-center py-16 px-4 fade-in-up"
            role="status"
        >
            {/* Icon */}
            <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--border-default)',
                }}
            >
                <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--accent-primary)' }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>

            {/* Title */}
            <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
            >
                Start a Conversation
            </h2>

            {/* Description */}
            <p
                className="max-w-md mb-8"
                style={{ color: 'var(--text-muted)' }}
            >
                Ask me anything! I'm here to help with code, answer questions, or explore creative ideas together.
            </p>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)',
                        }}
                        onClick={() => {
                            const input = document.querySelector('textarea[data-chat-input]') as HTMLTextAreaElement;
                            if (input) {
                                input.value = suggestion.text;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.focus();
                            }
                        }}
                    >
                        <span className="text-xl">{suggestion.icon}</span>
                        <span className="text-sm">{suggestion.text}</span>
                    </button>
                ))}
            </div>

            {/* Keyboard hint */}
            <p
                className="mt-8 text-xs"
                style={{ color: 'var(--text-muted)' }}
            >
                Press <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-tertiary)' }}>⌘K</kbd> for quick commands
            </p>
        </div>
    );
};

export default EmptyState;
