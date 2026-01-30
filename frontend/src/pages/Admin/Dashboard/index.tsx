import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    useTheme as useMuiTheme,
    CircularProgress,
    Button as MuiButton
} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import api from '../../../services/api';
import { useTheme } from '../../../hooks/useTheme';

interface DashboardMetrics {
    total_registrations: number;
    last_30_days: number;
    last_60_days: number;
    last_90_days: number;
    status_counts: { status: string; count: number }[];
    yearly_variation: { month: string; count: number }[];
    analyzed_this_month: number;
    avg_analysis_time_days: number;
}

interface Professional {
    id: string;
    name: string;
    status: string;
    cpf: string;
    submission_date: string;
}

export const Dashboard: React.FC = () => {
    const { theme } = useTheme();
    const muiTheme = useMuiTheme();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Theme-aware Chart Colors
    const chartColors = theme === 'dark'
        ? [muiTheme.palette.success.main, muiTheme.palette.info.main, muiTheme.palette.warning.main, muiTheme.palette.error.main]
        : [muiTheme.palette.success.main, muiTheme.palette.info.main, muiTheme.palette.warning.main, muiTheme.palette.error.main];

    const axisColor = muiTheme.palette.text.secondary;
    const gridColor = muiTheme.palette.divider;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [metricsRes, listRes] = await Promise.all([
                api.get('/api/admin/dashboard/'),
                api.get('/api/professionals/')
            ]);
            setMetrics(metricsRes.data);
            setProfessionals(listRes.data.results || listRes.data);
        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar os dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
                <CircularProgress size={60} />
                <Typography color="text.secondary">Carregando painel...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
                <Typography variant="h5" color="error">Ops! Algo deu errado.</Typography>
                <Typography color="text.secondary">{error}</Typography>
                <MuiButton variant="contained" onClick={fetchData} startIcon={<RefreshCw size={18} />}>
                    Tentar Novamente
                </MuiButton>
            </Box>
        );
    }

    if (!metrics) return null;

    const pieData = metrics.status_counts.map(item => ({
        name: item.status,
        value: item.count
    }));

    const areaData = metrics.yearly_variation.map(item => ({
        name: new Date(item.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        registrations: item.count
    }));

    const approved = metrics.status_counts.find(s => s.status === 'APPROVED')?.count || 0;
    const rejected = metrics.status_counts.find(s => s.status === 'REJECTED')?.count || 0;
    const adjustment = metrics.status_counts.find(s => s.status === 'ADJUSTMENT_REQUESTED')?.count || 0;
    const pending = metrics.status_counts.find(s => s.status === 'PENDING')?.count || 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'ADJUSTMENT_REQUESTED': return 'info';
            case 'PENDING': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4, animation: 'fadeIn 0.5s' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Dashboard Administrativo
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Visão geral de credenciamentos e métricas
                    </Typography>
                </Box>
                <MuiButton variant="contained" onClick={fetchData} startIcon={<RefreshCw size={18} />}>
                    Atualizar
                </MuiButton>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: 'Total', value: metrics.total_registrations, label: 'Cadastros Totais', color: 'text.primary' },
                    { title: 'Pendentes', value: pending, label: 'Aguardando Análise', color: 'warning.main' },
                    { title: 'Aprovados', value: approved, label: 'Credenciados', color: 'success.main' },
                    { title: 'Reprovados', value: rejected, label: 'Negados', color: 'error.main' },
                    { title: 'Ajustes', value: adjustment, label: 'Solicitados', color: 'info.main' }
                ].map((kpi) => (
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={kpi.title}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                    {kpi.title}
                                </Typography>
                                <Typography variant="h3" fontWeight={700} sx={{ color: kpi.color, my: 1 }}>
                                    {kpi.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ borderTop: 1, borderColor: 'divider', pt: 1, display: 'block' }}>
                                    {kpi.label}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Efficiency Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                    Eficiência
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="info.main">
                                    {metrics.analyzed_this_month}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Análises no Mês
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                    Tempo Médio
                                </Typography>
                                <Typography variant="h4" fontWeight={700}>
                                    {metrics.avg_analysis_time_days} <Typography component="span" variant="caption">dias</Typography>
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Cadastro → Decisão
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
                            {[
                                { val: metrics.last_30_days, label: '30d' },
                                { val: metrics.last_60_days, label: '60d' },
                                { val: metrics.last_90_days, label: '90d' },
                            ].map((item) => (
                                <Box key={item.label} sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight={700}>{item.val}</Typography>
                                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>Evolução de Cadastros</Typography>
                        <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer>
                                <AreaChart data={areaData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                                    <Tooltip contentStyle={{ backgroundColor: muiTheme.palette.background.paper, borderRadius: 8, boxShadow: muiTheme.shadows[3], border: 'none', color: muiTheme.palette.text.primary }} />
                                    <Area type="monotone" dataKey="registrations" stroke={muiTheme.palette.success.main} fill={muiTheme.palette.success.main} fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>Distribuição por Status</Typography>
                        <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: muiTheme.palette.background.paper, borderRadius: 8, boxShadow: muiTheme.shadows[3], border: 'none', color: muiTheme.palette.text.primary }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Registrations Table */}
            <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>Solicitações Recentes</Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>NOME</TableCell>
                                <TableCell>CPF</TableCell>
                                <TableCell>DATA</TableCell>
                                <TableCell>STATUS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {professionals.slice(0, 5).map((prof) => (
                                <TableRow key={prof.id} hover>
                                    <TableCell>{prof.name}</TableCell>
                                    <TableCell>{prof.cpf}</TableCell>
                                    <TableCell>{new Date(prof.submission_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={prof.status}
                                            size="small"
                                            color={getStatusColor(prof.status) as any}
                                            variant="outlined"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {professionals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        Nenhuma solicitação encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};
