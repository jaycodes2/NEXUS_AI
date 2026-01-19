import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    status?: 'sending' | 'sent' | 'failed';
    onRetry?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    role,
    content,
    timestamp,
    status = 'sent',
    onRetry,
}) => {
    const [showTimestamp, setShowTimestamp] = useState(false);
    const [copied, setCopied] = useState(false);

    const isUser = role === 'user';

    // Copy message content
    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Format timestamp
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isUser) {
        return (
            <div
                className="flex justify-end message-enter"
                onMouseEnter={() => setShowTimestamp(true)}
                onMouseLeave={() => setShowTimestamp(false)}
            >
                <div className="group relative max-w-[80%]">
                    {/* Glow effect */}
                    <div
                        className="absolute inset-0 rounded-2xl rounded-tr-md blur-sm opacity-30 group-hover:opacity-50 transition-opacity"
                        style={{ background: 'var(--accent-gradient)' }}
                    />

                    {/* Bubble */}
                    <div
                        className="relative px-5 py-3 rounded-2xl rounded-tr-md shadow-xl"
                        style={{
                            background: 'var(--bubble-user-bg)',
                            color: 'var(--bubble-user-text)',
                        }}
                        role="article"
                        aria-label={`Your message: ${content.slice(0, 50)}`}
                    >
                        <p className="leading-relaxed whitespace-pre-wrap">{content}</p>

                        {/* Status indicator */}
                        {status === 'sending' && (
                            <span
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'var(--bg-primary)' }}
                            >
                                <svg className="w-3 h-3 animate-spin" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </span>
                        )}
                        {status === 'failed' && (
                            <button
                                onClick={onRetry}
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                style={{ backgroundColor: 'var(--error)' }}
                                aria-label="Retry sending"
                            >
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Timestamp */}
                    {showTimestamp && timestamp && (
                        <div
                            className="absolute -bottom-6 right-0 text-xs fade-in-up"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {formatTime(timestamp)}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Assistant message
    return (
        <div
            className="flex gap-3 message-enter"
            onMouseEnter={() => setShowTimestamp(true)}
            onMouseLeave={() => setShowTimestamp(false)}
        >
            {/* AI Avatar */}
            <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: 'var(--accent-gradient)' }}
            >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-[85%]">
                <div
                    className="group relative backdrop-blur-sm px-5 py-4 rounded-2xl rounded-tl-md shadow-xl"
                    style={{
                        backgroundColor: 'var(--bubble-assistant-bg)',
                        border: '1px solid var(--bubble-assistant-border)',
                        color: 'var(--bubble-assistant-text)',
                    }}
                    role="article"
                    aria-label={`Assistant message`}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p({ children }) {
                                return (
                                    <p style={{ lineHeight: '1.75', marginBottom: '0.9rem', whiteSpace: 'pre-wrap' }}>
                                        {children}
                                    </p>
                                );
                            },
                            code({ inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        {...props}
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                            background: 'var(--code-bg)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            fontFamily: '"JetBrains Mono", monospace',
                                            border: '1px solid var(--border-default)',
                                        }}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code
                                        style={{
                                            background: 'var(--code-inline-bg)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: '13px',
                                            color: 'var(--code-inline-text)',
                                        }}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {content}
                    </ReactMarkdown>

                    {/* Actions - shown on hover */}
                    <div
                        className="absolute -bottom-4 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity fade-in-up"
                    >
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-muted)',
                            }}
                            aria-label={copied ? 'Copied!' : 'Copy message'}
                            title={copied ? 'Copied!' : 'Copy'}
                        >
                            {copied ? (
                                <svg className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Timestamp */}
                {showTimestamp && timestamp && (
                    <div
                        className="mt-1 ml-2 text-xs fade-in-up"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {formatTime(timestamp)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
