import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getDesignTokens } from '../theme';

interface ColorModeContextType {
    toggleColorMode: () => void;
    mode: 'light' | 'dark';
}

const ColorModeContext = createContext<ColorModeContextType>({
    toggleColorMode: () => { },
    mode: 'light',
});

export const useColorMode = () => {
    const context = useContext(ColorModeContext);
    if (!context) {
        throw new Error('useColorMode must be used within an AppThemeProvider');
    }
    return context;
};

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', mode);
        // Sync with old index.css method if needed temporarily, or clear it
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
    }, [mode]);

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
            mode,
        }),
        [mode]
    );

    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};
