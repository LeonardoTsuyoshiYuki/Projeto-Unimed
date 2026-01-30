import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    TextField,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import { Search, FileSpreadsheet, Eye } from 'lucide-react';
import api from '../../../services/api';

interface Professional {
    id: string;
    name: string;
    education: string;
    submission_date: string;
    status: string;
}

const ProfessionalsList: React.FC = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const navigate = useNavigate();

    const fetchProfessionals = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/api/professionals/', { params });
            setProfessionals(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching professionals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProfessionals();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    const handleExport = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/api/professionals/export_excel/', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'profissionais_unimed.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error("Export failed", error);
            alert("Erro ao exportar Excel.");
        }
    };

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
                <Typography variant="h4" fontWeight="bold">
                    Profissionais Cadastrados
                </Typography>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<FileSpreadsheet size={20} />}
                    onClick={handleExport}
                >
                    Exportar Excel
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="Buscar por nome, CPF, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={20} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        size="small"
                        sx={{ minWidth: 200 }}
                        SelectProps={{ displayEmpty: true }}
                    >
                        <MenuItem value="">Todos os Status</MenuItem>
                        <MenuItem value="PENDING">Pendente</MenuItem>
                        <MenuItem value="APPROVED">Aprovado</MenuItem>
                        <MenuItem value="REJECTED">Rejeitado</MenuItem>
                        <MenuItem value="NEEDS_ADJUSTMENT">Requer Ajustes</MenuItem>
                    </TextField>
                </Stack>
            </Paper>

            <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>NOME</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>FORMAÇÃO</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>DATA ENVIO</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">AÇÕES</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : professionals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                        Nenhum profissional encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                professionals.map((prof) => (
                                    <TableRow key={prof.id} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>{prof.name}</TableCell>
                                        <TableCell>{prof.education}</TableCell>
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
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Eye size={16} />}
                                                onClick={() => navigate(`/admin/professionals/${prof.id}`)}
                                            >
                                                Detalhes
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default ProfessionalsList;
