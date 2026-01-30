import React from 'react';
import { Outlet, Navigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Button,
    Divider,
    useTheme as useMuiTheme
} from '@mui/material';
import {
    LayoutDashboard,
    Users,
    Moon,
    Sun,
    LogOut
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme'; // Bridge hook

const drawerWidth = 260;

export const AdminLayout: React.FC = () => {
    const { isAuthenticated, loading, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const muiTheme = useMuiTheme();
    const location = useLocation();

    if (loading) {
        return <Box sx={{ p: 3 }}>Carregando...</Box>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    const menuItems = [
        { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
        { text: 'Profissionais', icon: <Users size={20} />, path: '/admin/professionals' },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'background.paper',
                        borderRight: `1px solid ${muiTheme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
                    },
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        Unimed Admin
                    </Typography>
                </Box>

                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1, px: 1 }}>
                            <ListItemButton
                                component={RouterLink}
                                to={item.path}
                                selected={location.pathname === item.path}
                                sx={{
                                    borderRadius: 1,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.dark',
                                        '& .lucide': { color: 'primary.dark' },
                                        '&:hover': { bgcolor: 'primary.light' } // Disable hover darken on selected
                                    },
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'primary.dark' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: location.pathname === item.path ? 600 : 400
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ flexGrow: 1 }} />

                <Divider sx={{ my: 1 }} />

                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                        variant="text"
                        onClick={toggleTheme}
                        startIcon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        fullWidth
                        sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
                    >
                        {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                    </Button>

                    <Button
                        variant="outlined"
                        color="error"
                        onClick={logout}
                        startIcon={<LogOut size={18} />}
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                    >
                        Sair
                    </Button>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', bgcolor: 'background.default', p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
};
