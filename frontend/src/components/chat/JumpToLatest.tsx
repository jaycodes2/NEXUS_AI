import React from 'react';

interface JumpToLatestProps {
    isVisible: boolean;
    onClick: () => void;
}

export const JumpToLatest: React.FC<JumpToLatestProps> = ({ isVisible, onClick }) => {
    if (!isVisible) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 message-enter"
            style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-lg)',
            }}
            aria-label="Jump to latest message"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-medium">Jump to latest</span>
        </button>
    );
};

export default JumpToLatest;
