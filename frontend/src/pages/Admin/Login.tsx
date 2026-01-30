import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Container
} from '@mui/material';
import { Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/api/token/', { username, password });
            login(response.data.access);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Credenciais inválidas. Verifique usuário e senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 2
            }}
        >
            <Container maxWidth="xs">
                <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
                    <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{
                                display: 'inline-flex',
                                p: 1.5,
                                borderRadius: '50%',
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                mb: 2
                            }}>
                                <Lock size={24} />
                            </Box>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Acesso Administrativo
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Entre com suas credenciais para continuar
                            </Typography>
                        </Box>

                        {error && <Alert severity="error">{error}</Alert>}

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <TextField
                                label="Usuário"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                fullWidth
                                required
                                autoFocus
                            />
                            <TextField
                                label="Senha"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                fullWidth
                                required
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                                sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};
