import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Box,
    Container,
    Toolbar,
    Typography,
    Link,
    Chip,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme'; // Bridge hook

export const Layout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        {/* Logo Section */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5" component="div" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: -0.5 }}>
                                Unimed
                            </Typography>
                            <Chip
                                label="Credenciamento"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    height: 24
                                }}
                            />
                        </Box>

                        {/* Navigation */}
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Link component={RouterLink} to="/" underline="none" color="text.secondary" sx={{ fontWeight: 500, '&:hover': { color: 'primary.main' } }}>
                                Início
                            </Link>
                            <Link component={RouterLink} to="/register" underline="none" color="text.secondary" sx={{ fontWeight: 500, '&:hover': { color: 'primary.main' } }}>
                                Quero me Credenciar
                            </Link>
                            <Link component={RouterLink} to="/admin" underline="none" color="text.secondary" sx={{ fontWeight: 500, '&:hover': { color: 'primary.main' } }}>
                                Área Administrativa
                            </Link>

                            <Tooltip title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}>
                                <IconButton onClick={toggleTheme} color="inherit">
                                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: 6 }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box component="footer" sx={{ bgcolor: 'background.paper', py: 4, borderTop: 1, borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" align="center">
                        © 2026 Unimed - Todos os direitos reservados.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};
