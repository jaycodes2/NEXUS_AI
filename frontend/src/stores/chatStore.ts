import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export type ThemeType = 'light' | 'dark' | 'oled' | 'high-contrast' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'failed';
export type MessageRole = 'user' | 'assistant';

export interface Reaction {
    emoji: string;
    count: number;
}

export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
}

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    status: MessageStatus;
    reactions: Reaction[];
    isEdited: boolean;
    replyTo?: string;
    attachments?: Attachment[];
    isPinned?: boolean;
    isBookmarked?: boolean;
}

export interface SlashCommand {
    command: string;
    description: string;
    action: () => void;
}

// ============================================
// Store Interface
// ============================================

interface ChatState {
    // Theme
    theme: ThemeType;
    resolvedTheme: 'light' | 'dark' | 'oled' | 'high-contrast';
    setTheme: (theme: ThemeType) => void;

    // Messages (for extended features - existing logic preserved)
    extendedMessages: Message[];
    addExtendedMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'status' | 'reactions' | 'isEdited'>) => string;
    updateExtendedMessage: (id: string, updates: Partial<Message>) => void;
    deleteExtendedMessage: (id: string) => void;

    // UI State
    isTyping: boolean;
    setIsTyping: (typing: boolean) => void;
    isStreaming: boolean;
    setIsStreaming: (streaming: boolean) => void;
    streamingContent: string;
    setStreamingContent: (content: string) => void;

    // Input State
    inputValue: string;
    setInputValue: (value: string) => void;
    attachments: File[];
    addAttachment: (file: File) => void;
    removeAttachment: (index: number) => void;
    clearAttachments: () => void;

    // Scroll State
    showJumpToLatest: boolean;
    setShowJumpToLatest: (show: boolean) => void;

    // Command Palette
    isCommandPaletteOpen: boolean;
    toggleCommandPalette: () => void;
    setCommandPaletteOpen: (open: boolean) => void;

    // Emoji Picker
    isEmojiPickerOpen: boolean;
    setEmojiPickerOpen: (open: boolean) => void;

    // Sidebar
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;

    // Reactions
    addReaction: (messageId: string, emoji: string) => void;
    removeReaction: (messageId: string, emoji: string) => void;

    // Pin & Bookmark
    togglePin: (messageId: string) => void;
    toggleBookmark: (messageId: string) => void;
}

// ============================================
// Helper Functions
// ============================================

const generateId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
};

const resolveTheme = (theme: ThemeType): 'light' | 'dark' | 'oled' | 'high-contrast' => {
    if (theme === 'system') {
        return getSystemTheme();
    }
    return theme;
};

// ============================================
// Store Implementation
// ============================================

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            // Theme
            theme: 'dark',
            resolvedTheme: 'dark',
            setTheme: (theme) => {
                const resolved = resolveTheme(theme);
                set({ theme, resolvedTheme: resolved });

                // Apply to document
                if (typeof document !== 'undefined') {
                    document.documentElement.setAttribute('data-theme', resolved);
                }
            },

            // Extended Messages
            extendedMessages: [],
            addExtendedMessage: (msg) => {
                const id = generateId();
                const newMessage: Message = {
                    ...msg,
                    id,
                    timestamp: new Date(),
                    status: 'sending',
                    reactions: [],
                    isEdited: false,
                };
                set((state) => ({
                    extendedMessages: [...state.extendedMessages, newMessage],
                }));
                return id;
            },
            updateExtendedMessage: (id, updates) => {
                set((state) => ({
                    extendedMessages: state.extendedMessages.map((msg) =>
                        msg.id === id ? { ...msg, ...updates } : msg
                    ),
                }));
            },
            deleteExtendedMessage: (id) => {
                set((state) => ({
                    extendedMessages: state.extendedMessages.filter((msg) => msg.id !== id),
                }));
            },

            // UI State
            isTyping: false,
            setIsTyping: (typing) => set({ isTyping: typing }),
            isStreaming: false,
            setIsStreaming: (streaming) => set({ isStreaming: streaming }),
            streamingContent: '',
            setStreamingContent: (content) => set({ streamingContent: content }),

            // Input State
            inputValue: '',
            setInputValue: (value) => set({ inputValue: value }),
            attachments: [],
            addAttachment: (file) => set((state) => ({
                attachments: [...state.attachments, file]
            })),
            removeAttachment: (index) => set((state) => ({
                attachments: state.attachments.filter((_, i) => i !== index),
            })),
            clearAttachments: () => set({ attachments: [] }),

            // Scroll State
            showJumpToLatest: false,
            setShowJumpToLatest: (show) => set({ showJumpToLatest: show }),

            // Command Palette
            isCommandPaletteOpen: false,
            toggleCommandPalette: () => set((state) => ({
                isCommandPaletteOpen: !state.isCommandPaletteOpen
            })),
            setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

            // Emoji Picker
            isEmojiPickerOpen: false,
            setEmojiPickerOpen: (open) => set({ isEmojiPickerOpen: open }),

            // Sidebar
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({
                isSidebarCollapsed: !state.isSidebarCollapsed
            })),

            // Reactions
            addReaction: (messageId, emoji) => {
                set((state) => ({
                    extendedMessages: state.extendedMessages.map((msg) => {
                        if (msg.id !== messageId) return msg;
                        const existing = msg.reactions.find((r) => r.emoji === emoji);
                        if (existing) {
                            return {
                                ...msg,
                                reactions: msg.reactions.map((r) =>
                                    r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                                ),
                            };
                        }
                        return {
                            ...msg,
                            reactions: [...msg.reactions, { emoji, count: 1 }],
                        };
                    }),
                }));
            },
            removeReaction: (messageId, emoji) => {
                set((state) => ({
                    extendedMessages: state.extendedMessages.map((msg) => {
                        if (msg.id !== messageId) return msg;
                        return {
                            ...msg,
                            reactions: msg.reactions
                                .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r))
                                .filter((r) => r.count > 0),
                        };
                    }),
                }));
            },

            // Pin & Bookmark
            togglePin: (messageId) => {
                set((state) => ({
                    extendedMessages: state.extendedMessages.map((msg) =>
                        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
                    ),
                }));
            },
            toggleBookmark: (messageId) => {
                set((state) => ({
                    extendedMessages: state.extendedMessages.map((msg) =>
                        msg.id === messageId ? { ...msg, isBookmarked: !msg.isBookmarked } : msg
                    ),
                }));
            },
        }),
        {
            name: 'nexus-chat-store',
            partialize: (state) => ({
                theme: state.theme,
                resolvedTheme: state.resolvedTheme,
            }),
        }
    )
);

// ============================================
// Theme Initialization Hook
// ============================================

export const initializeTheme = () => {
    const { theme, setTheme } = useChatStore.getState();

    // Apply persisted theme on load
    const resolved = resolveTheme(theme);
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', resolved);
    }

    // Listen for system theme changes
    if (typeof window !== 'undefined' && theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            setTheme('system');
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
};
