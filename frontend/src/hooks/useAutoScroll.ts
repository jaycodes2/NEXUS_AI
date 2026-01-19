import { useEffect, useCallback, useRef, useState } from 'react';

interface UseAutoScrollOptions {
    threshold?: number; // Distance from bottom to consider "at bottom"
    behavior?: ScrollBehavior;
}

export function useAutoScroll(
    dependencies: any[],
    options: UseAutoScrollOptions = {}
) {
    const { threshold = 100, behavior = 'smooth' } = options;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showJumpButton, setShowJumpButton] = useState(false);

    // Check if user is near bottom
    const checkIfAtBottom = useCallback(() => {
        const container = containerRef.current;
        if (!container) return true;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        return distanceFromBottom <= threshold;
    }, [threshold]);

    // Scroll to bottom
    const scrollToBottom = useCallback((force = false) => {
        if (force || isAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior });
        }
    }, [isAtBottom, behavior]);

    // Handle scroll events
    const handleScroll = useCallback(() => {
        const atBottom = checkIfAtBottom();
        setIsAtBottom(atBottom);
        setShowJumpButton(!atBottom);
    }, [checkIfAtBottom]);

    // Auto-scroll when dependencies change
    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        }
    }, [...dependencies, isAtBottom]);

    // Attach scroll listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return {
        containerRef,
        bottomRef,
        isAtBottom,
        showJumpButton,
        scrollToBottom: () => scrollToBottom(true),
    };
}

export default useAutoScroll;
