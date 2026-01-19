import { useEffect, useCallback } from 'react';
import { useChatStore, ThemeType } from '../stores/chatStore';

// ============================================
// Theme Hook
// ============================================

export function useTheme() {
    const { theme, resolvedTheme, setTheme } = useChatStore();

    // Initialize theme on mount
    useEffect(() => {
        const resolved = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

        document.documentElement.setAttribute('data-theme', resolved);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Cycle through themes
    const cycleTheme = useCallback(() => {
        const themes: ThemeType[] = ['light', 'dark', 'oled', 'high-contrast'];
        const currentIndex = themes.indexOf(resolvedTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    }, [resolvedTheme, setTheme]);

    // Get theme icon
    const getThemeIcon = useCallback(() => {
        switch (resolvedTheme) {
            case 'light':
                return '☀️';
            case 'dark':
                return '🌙';
            case 'oled':
                return '⚫';
            case 'high-contrast':
                return '👁️';
            default:
                return '🌙';
        }
    }, [resolvedTheme]);

    // Get theme label
    const getThemeLabel = useCallback(() => {
        switch (resolvedTheme) {
            case 'light':
                return 'Light';
            case 'dark':
                return 'Dark';
            case 'oled':
                return 'OLED';
            case 'high-contrast':
                return 'High Contrast';
            default:
                return 'Dark';
        }
    }, [resolvedTheme]);

    return {
        theme,
        resolvedTheme,
        setTheme,
        cycleTheme,
        getThemeIcon,
        getThemeLabel,
        isDark: resolvedTheme === 'dark' || resolvedTheme === 'oled',
    };
}

export default useTheme;
