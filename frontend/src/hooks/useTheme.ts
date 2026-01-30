import { useColorMode } from '../contexts/ColorModeContext';

// Adapter hook to maintain compatibility while migrating to MUI
export const useTheme = () => {
    const { mode, toggleColorMode } = useColorMode();

    return {
        theme: mode,
        toggleTheme: toggleColorMode
    };
};
