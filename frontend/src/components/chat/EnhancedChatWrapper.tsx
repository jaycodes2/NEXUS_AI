/**
 * NEXUS AI Chat Integration Example
 * 
 * This file demonstrates how to integrate all the new chat components
 * into your existing Chat component without modifying its logic.
 * 
 * Usage: Import these components and wrap/combine with your existing chat.
 */

import React from 'react';

// Import new components
import {
    ChatHeader,
    ChatInput,
    CommandPalette,
    TypingIndicator,
    EmptyState,
    JumpToLatest,
    MessageBubble,
} from './index';

// Import hooks
import { useTheme } from '../../hooks/useTheme';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';

// Import store
import { useChatStore } from '../../stores/chatStore';

/**
 * Example: Enhanced Chat Wrapper
 * 
 * Wrap your existing Chat component with this to add all the new features.
 * Your existing logic remains untouched.
 */
interface EnhancedChatProps {
    children: React.ReactNode; // Your existing chat content
}

export const EnhancedChatWrapper: React.FC<EnhancedChatProps> = ({ children }) => {
    // Initialize hooks
    useKeyboardNav();
    const { resolvedTheme } = useTheme();

    return (
        <div
            className="flex flex-col h-full"
            style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
            }}
        >
            {/* Command Palette - Global overlay */}
            <CommandPalette />

            {/* Your existing chat content */}
            {children}
        </div>
    );
};

/**
 * Example: How to use the new MessageBubble component
 */
export const ExampleMessageList: React.FC<{
    messages: Array<{ prompt: string; reply: string }>
}> = ({ messages }) => {
    const { containerRef, bottomRef, showJumpButton, scrollToBottom } = useAutoScroll(
        [messages],
        { threshold: 100 }
    );

    return (
        <>
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6"
            >
                {messages.length === 0 && <EmptyState />}

                {messages.map((m, i) => (
                    <div key={i} className="space-y-4">
                        <MessageBubble
                            role="user"
                            content={m.prompt}
                            timestamp={new Date()}
                            status="sent"
                        />
                        <MessageBubble
                            role="assistant"
                            content={m.reply}
                            timestamp={new Date()}
                        />
                    </div>
                ))}

                <div ref={bottomRef} />
            </div>

            <JumpToLatest isVisible={showJumpButton} onClick={scrollToBottom} />
        </>
    );
};

/**
 * Quick Start Guide:
 * 
 * 1. Import the theme CSS (already added to index.css)
 * 
 * 2. Use ChatHeader at the top of your chat:
 *    <ChatHeader title="NEXUS AI" subtitle="Always ready" />
 * 
 * 3. Use ChatInput at the bottom:
 *    <ChatInput 
 *      value={prompt} 
 *      onChange={setPrompt} 
 *      onSend={sendPrompt}
 *      disabled={loading}
 *    />
 * 
 * 4. Add CommandPalette anywhere (it's a modal):
 *    <CommandPalette />
 * 
 * 5. Use useTheme() hook for theme switching:
 *    const { cycleTheme, getThemeIcon } = useTheme();
 * 
 * 6. Press ⌘K or Ctrl+K to open command palette
 * 
 * 7. Available themes: light, dark, oled, high-contrast
 */

export default EnhancedChatWrapper;
