import type { PaletteMode } from '@mui/material';

export const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light Mode (Institutional)
                primary: {
                    main: '#00995d', // Unimed Green
                    light: '#d1fae5',
                    dark: '#047857',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#f8fafc', // Slate 50
                    paper: '#ffffff',
                },
                text: {
                    primary: '#1e293b', // Slate 800
                    secondary: '#64748b', // Slate 500
                },
            }
            : {
                // Dark Mode (Enterprise Slate)
                primary: {
                    main: '#22c55e', // Vibrant Green
                    light: 'rgba(34, 197, 94, 0.1)',
                    dark: '#15803d',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#0f172a', // Slate 900
                    paper: '#1e293b',   // Slate 800
                },
                text: {
                    primary: '#f1f5f9', // Slate 100
                    secondary: '#94a3b8', // Slate 400
                },
            }),
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2rem', fontWeight: 700 },
        h2: { fontSize: '1.75rem', fontWeight: 600 },
        h3: { fontSize: '1.5rem', fontWeight: 600 },
        h4: { fontSize: '1.25rem', fontWeight: 600 },
        h5: { fontSize: '1.1rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 600 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8, // --radius-md
                    fontWeight: 600,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove default MUI overlay in dark mode
                },
                rounded: {
                    borderRadius: 16, // --radius-lg
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid',
                    borderColor: mode === 'dark' ? '#334155' : '#e2e8f0', // Manual adjustment as simple borders aren't in palette
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                    },
                    '& input:-webkit-autofill': {
                        WebkitBoxShadow: mode === 'dark' ? '0 0 0 100px #1e293b inset' : '0 0 0 100px #ffffff inset',
                        WebkitTextFillColor: mode === 'dark' ? '#f1f5f9' : '#1e293b',
                        caretColor: mode === 'dark' ? '#f1f5f9' : '#1e293b',
                        borderRadius: '0px', // Prevent rounded corners on autofill background
                    },
                },
                notchedOutline: {
                    borderColor: mode === 'dark' ? '#475569' : '#e2e8f0',
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: mode === 'dark' ? '#94a3b8' : '#64748b',
                    '&.Mui-focused': {
                        color: mode === 'dark' ? '#22c55e' : '#047857',
                    },
                },
            },
        },
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    marginLeft: 4,
                },
            },
        },
    },
} as const);
