import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Chip,
    Divider,
    Stack,
    Paper,
    Avatar,
    IconButton,
    TextField,
    List,
    ListItem,
    ListItemText,
    CircularProgress
} from '@mui/material';
import {
    Download,
    User,
    Briefcase,
    FileText,
    ClipboardList,
    History,
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Image as ImageIcon
} from 'lucide-react';
import api from '../../../services/api';

interface AuditLog {
    id: number;
    user_name: string;
    action: string;
    details: string;
    timestamp: string;
}

interface Document {
    id: string;
    file: string;
    description: string;
    uploaded_at: string;
    file_size?: number;
}

interface Professional {
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    birth_date: string;
    zip_code: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    education: string;
    institution: string;
    graduation_year: number;
    council_name: string;
    council_number: string;
    experience_years: number;
    area_of_action: string;
    status: string;
    submission_date: string;
    documents: Document[];
    internal_notes?: string;
}

const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ textTransform: 'uppercase', mb: 0.5 }}>
            {label}
        </Typography>
        <Typography variant="body1" sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', fontWeight: 500 }}>
            {value || '-'}
        </Typography>
    </Box>
);

const ProfessionalDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [profRes, logsRes] = await Promise.all([
                    api.get(`/api/professionals/${id}/`),
                    api.get(`/api/professionals/${id}/history/`)
                ]);
                setProfessional(profRes.data);
                setNotes(profRes.data.internal_notes || '');
                setAuditLogs(logsRes.data);
            } catch (error) {
                console.error("Error fetching data", error);
                alert("Erro ao carregar dados do profissional.");
                navigate('/admin/professionals');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleSaveNotes = async () => {
        if (!professional) return;
        setSavingNotes(true);
        try {
            await api.patch(`/api/professionals/${professional.id}/`, { internal_notes: notes });
            alert("Observações salvas!");
            const logsRes = await api.get(`/api/professionals/${id}/history/`);
            setAuditLogs(logsRes.data);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar observações.");
        } finally {
            setSavingNotes(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!professional) return;
        if (!window.confirm(`Tem certeza que deseja mudar o status para ${newStatus}?`)) return;

        try {
            await api.patch(`/api/professionals/${professional.id}/`, { status: newStatus });
            const [profRes, logsRes] = await Promise.all([
                api.get(`/api/professionals/${id}/`),
                api.get(`/api/professionals/${id}/history/`)
            ]);
            setProfessional(profRes.data);
            setAuditLogs(logsRes.data);
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar status.");
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

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const s = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
    if (!professional) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Profissional não encontrado.</Typography></Box>;

    return (
        <Container maxWidth="xl" sx={{ py: 4, animation: 'fadeIn 0.5s' }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>{professional.name.charAt(0)}</Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight={700}>{professional.name}</Typography>
                                <Typography variant="body2" color="text.secondary">CPF: {professional.cpf} • Cadastro: {new Date(professional.submission_date).toLocaleDateString()}</Typography>
                            </Box>
                        </Stack>
                        <Chip
                            label={professional.status}
                            color={getStatusColor(professional.status) as any}
                            sx={{ fontWeight: 700, mt: 1 }}
                        />
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Button variant="outlined" startIcon={<ArrowLeft />} onClick={() => navigate('/admin/professionals')}>
                            Voltar
                        </Button>
                        <Button variant="outlined" startIcon={<Download />} onClick={() => {/* Copy export logic */ }}>
                            Exportar
                        </Button>
                    </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
                    <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleStatusChange('APPROVED')}>
                        Aprovar
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<XCircle />} onClick={() => handleStatusChange('REJECTED')}>
                        Reprovar
                    </Button>
                    <Button variant="outlined" color="warning" startIcon={<AlertTriangle />} onClick={() => handleStatusChange('NEEDS_ADJUSTMENT')}>
                        Solicitar Ajustes
                    </Button>
                </Stack>
            </Paper>

            <Grid container spacing={3}>
                {/* Personal Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            avatar={<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><User size={20} /></Avatar>}
                            title={<Typography variant="h6" fontWeight={600}>Dados Pessoais</Typography>}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="E-mail" value={professional.email} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="Telefone" value={professional.phone} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="CPF" value={professional.cpf} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="Nascimento" value={new Date(professional.birth_date).toLocaleDateString()} />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <InfoItem label="Logradouro" value={`${professional.street}, ${professional.number}`} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <InfoItem label="Bairro" value={professional.neighborhood} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="Cidade/UF" value={`${professional.city} / ${professional.state}`} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="CEP" value={professional.zip_code} />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Professional Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            avatar={<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><Briefcase size={20} /></Avatar>}
                            title={<Typography variant="h6" fontWeight={600}>Dados Profissionais</Typography>}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <InfoItem label="Formação Acadêmica" value={professional.education} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <InfoItem label="Instituição" value={`${professional.institution} (${professional.graduation_year})`} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <InfoItem label="Experiência" value={`${professional.experience_years} anos`} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="Conselho de Classe" value={`${professional.council_name}: ${professional.council_number}`} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InfoItem label="Área de Atuação" value={professional.area_of_action} />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Documents */}
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardHeader
                            avatar={<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><FileText size={20} /></Avatar>}
                            title={<Typography variant="h6" fontWeight={600}>Documentos Comprobatórios</Typography>}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={2}>
                                {professional.documents?.map((doc) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                                        <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}>
                                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light', color: 'primary.main' }}>
                                                {doc.file.endsWith('pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
                                            </Box>
                                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                                <Typography variant="subtitle2" noWrap title={doc.file.split('/').pop()}>
                                                    {doc.file.split('/').pop()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatFileSize(doc.file_size)}
                                                </Typography>
                                            </Box>
                                            <IconButton size="small" onClick={() => {/* Download logic */ }}>
                                                <Download size={18} />
                                            </IconButton>
                                        </Paper>
                                    </Grid>
                                ))}
                                {(!professional.documents || professional.documents.length === 0) && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography color="text.secondary" fontStyle="italic">Nenhum documento anexado.</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Notes */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            avatar={<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><ClipboardList size={20} /></Avatar>}
                            title={<Typography variant="h6" fontWeight={600}>Observações Internas</Typography>}
                        />
                        <Divider />
                        <CardContent>
                            <TextField
                                multiline
                                rows={6}
                                fullWidth
                                placeholder="Adicione notas internas..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" onClick={handleSaveNotes} disabled={savingNotes}>
                                    {savingNotes ? 'Salvando...' : 'Salvar Observações'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Audit Log */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', maxHeight: 500, overflow: 'auto' }}>
                        <CardHeader
                            avatar={<Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><History size={20} /></Avatar>}
                            title={<Typography variant="h6" fontWeight={600}>Histórico de Alterações</Typography>}
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            <List>
                                {auditLogs.map((log, index) => (
                                    <React.Fragment key={log.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="subtitle2" fontWeight={600}>{log.user_name || 'Sistema'}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleString()}</Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="primary" display="block" fontWeight={500}>
                                                            {log.action}
                                                        </Typography>
                                                        {log.details}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < auditLogs.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ProfessionalDetail;
