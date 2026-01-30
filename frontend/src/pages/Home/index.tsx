import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Stack,
    useTheme,
    alpha
} from '@mui/material';
import { ShieldCheck, Monitor, Clock, ChevronRight } from 'lucide-react';

export const Home: React.FC = () => {
    const theme = useTheme();

    return (
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 15 }, pb: 8, animation: 'fadeIn 1s' }}>
            <Box sx={{ textAlign: 'center', mb: 10, maxWidth: 800, mx: 'auto' }}>
                <Typography
                    variant="h2"
                    component="h1"
                    fontWeight={800}
                    gutterBottom
                    sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main || theme.palette.primary.light})`,
                        backgroundClip: 'text',
                        textFillColor: 'transparent',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 2
                    }}
                >
                    Credenciamento de Profissionais
                </Typography>
                <Typography
                    variant="h5"
                    color="text.secondary"
                    sx={{ mb: 5, lineHeight: 1.6 }}
                >
                    Junte-se à maior rede de saúde do Brasil. Realize seu cadastro online
                    de forma rápida, segura e 100% digital.
                </Typography>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="center"
                >
                    <Button
                        component={RouterLink}
                        to="/register"
                        variant="contained"
                        size="large"
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 50
                        }}
                        endIcon={<ChevronRight />}
                    >
                        Iniciar Credenciamento
                    </Button>
                    <Button
                        component={RouterLink}
                        to="/admin"
                        variant="outlined"
                        size="large"
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 50
                        }}
                    >
                        Acesso Administrativo
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={4}>
                {[
                    {
                        title: '100% Digital',
                        desc: 'Envie seus documentos sem sair de casa.',
                        icon: <Monitor size={40} />
                    },
                    {
                        title: 'Seguro',
                        desc: 'Seus dados protegidos conforme a LGPD.',
                        icon: <ShieldCheck size={40} />
                    },
                    {
                        title: 'Ágil',
                        desc: 'Acompanhe o status da sua solicitação por e-mail.',
                        icon: <Clock size={40} />
                    }
                ].map((feature) => (
                    <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
                        <Card
                            sx={{
                                height: '100%',
                                textAlign: 'left',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: theme.shadows[10],
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 3,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {feature.desc}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};
