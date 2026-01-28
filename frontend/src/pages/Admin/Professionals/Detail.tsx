import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import styles from './styles.module.css';
import { FileText, Download, User, Briefcase, File, Image as ImageIcon, ClipboardList, History } from 'lucide-react';

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
                    api.get(`/professionals/${id}/`),
                    api.get(`/professionals/${id}/history/`)
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
            await api.patch(`/professionals/${professional.id}/`, { internal_notes: notes });
            alert("Observações salvas!");
            // Refresh logs
            const logsRes = await api.get(`/professionals/${id}/history/`);
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
            await api.patch(`/professionals/${professional.id}/`, { status: newStatus });

            // Refresh all data
            const [profRes, logsRes] = await Promise.all([
                api.get(`/professionals/${id}/`),
                api.get(`/professionals/${id}/history/`)
            ]);
            setProfessional(profRes.data);
            setAuditLogs(logsRes.data);
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar status.");
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Tamanho desconhecido';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FileText size={24} />;
        if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <ImageIcon size={24} />;
        return <File size={24} />;
    };

    if (loading) return <div className={styles.loading}>Carregando...</div>;
    if (!professional) return <div className={styles.error}>Profissional não encontrado.</div>;

    return (
        <div className={styles.container}>
            {/* 1. Cabeçalho Fixo */}
            <header className={styles.detailHeader}>
                <div className={styles.headerInfo}>
                    <h1>{professional.name}</h1>
                    <div className={styles.headerMeta}>
                        <span>CPF: {professional.cpf}</span>
                        <span className={`${styles.statusBadge} ${styles[professional.status]}`}>
                            {professional.status}
                        </span>
                        <span>Cadastrado em: {new Date(professional.submission_date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={`${styles.actionBtn} ${styles.outlineBtn}`}
                        onClick={() => {
                            if (professional) {
                                // Trigger the export logic or open URL
                                window.open(`http://localhost:8000/api/professionals/export_excel/?id=${professional.id}`, '_blank');
                            }
                        }}
                    >
                        <Download size={18} />
                        Exportar Excel
                    </button>
                    <button className={`${styles.actionBtn} ${styles.outlineBtn}`} onClick={() => navigate('/admin/professionals')}>
                        Voltar
                    </button>
                    <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={() => handleStatusChange('APPROVED')}>
                        Aprovar
                    </button>
                    <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => handleStatusChange('REJECTED')}>
                        Reprovar
                    </button>
                    <button className={`${styles.actionBtn} ${styles.warningBtn}`} onClick={() => handleStatusChange('NEEDS_ADJUSTMENT')}>
                        Ajustes
                    </button>
                </div>
            </header>

            {/* 2. Dados Pessoais */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>
                    <User size={20} />
                    Dados Pessoais
                </div>
                <div className={styles.grid}>
                    <div className={styles.field}><span className={styles.label}>Nome Completo</span><span className={styles.value}>{professional.name}</span></div>
                    <div className={styles.field}><span className={styles.label}>CPF</span><span className={styles.value}>{professional.cpf}</span></div>
                    <div className={styles.field}><span className={styles.label}>Data de Nascimento</span><span className={styles.value}>{new Date(professional.birth_date).toLocaleDateString()}</span></div>
                    <div className={styles.field}><span className={styles.label}>E-mail</span><span className={styles.value}>{professional.email}</span></div>
                    <div className={styles.field}><span className={styles.label}>Telefone</span><span className={styles.value}>{professional.phone}</span></div>
                    <div className={styles.field}><span className={styles.label}>Localização</span><span className={styles.value}>{professional.city} / {professional.state}</span></div>
                    <div className={styles.field}><span className={styles.label}>Endereço</span><span className={styles.value}>{professional.street}, {professional.number} - {professional.neighborhood}</span></div>
                    <div className={styles.field}><span className={styles.label}>CEP</span><span className={styles.value}>{professional.zip_code}</span></div>
                </div>
            </section>

            {/* 3. Dados Profissionais */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>
                    <Briefcase size={20} />
                    Dados Profissionais
                </div>
                <div className={styles.grid}>
                    <div className={styles.field}><span className={styles.label}>Formação</span><span className={styles.value}>{professional.education}</span></div>
                    <div className={styles.field}><span className={styles.label}>Instituição</span><span className={styles.value}>{professional.institution} ({professional.graduation_year})</span></div>
                    <div className={styles.field}><span className={styles.label}>Conselho Profissional</span><span className={styles.value}>{professional.council_name}: {professional.council_number}</span></div>
                    <div className={styles.field}><span className={styles.label}>Tempo de Experiência</span><span className={styles.value}>{professional.experience_years} anos</span></div>
                    <div className={styles.field}><span className={styles.label}>Área de Atuação</span><span className={styles.value}>{professional.area_of_action || '-'}</span></div>
                </div>
            </section>

            {/* 4. Documentos */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>
                    <FileText size={20} />
                    Documentos Comprobatórios
                </div>
                {(!professional.documents || professional.documents.length === 0) ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>Nenhum documento anexado.</p>
                ) : (
                    <ul className={styles.documentList}>
                        {professional.documents.map((doc) => (
                            <li key={doc.id} className={styles.documentItem}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div className={styles.docIcon}>
                                        {getFileIcon(doc.file)}
                                    </div>
                                    <div className={styles.docInfo}>
                                        <span className={styles.docName}>{doc.file.split('/').pop()}</span>
                                        <div className={styles.docMeta}>
                                            <span>{formatFileSize(doc.file_size)}</span>
                                            <span style={{ margin: '0 8px' }}>•</span>
                                            <span>{doc.description}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className={styles.downloadBtn}
                                    onClick={async () => {
                                        try {
                                            const response = await api.get(`/documents/${doc.id}/download/`, { responseType: 'blob' });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', doc.file.split('/').pop() || 'documento');
                                            document.body.appendChild(link);
                                            link.click();
                                        } catch (err) {
                                            alert('Erro ao baixar documento.');
                                        }
                                    }}
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 5. Observações Internas */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>
                    <ClipboardList size={20} />
                    Observações Internas (Admin)
                </div>
                <textarea
                    className={styles.notesArea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione notas internas sobre este profissional..."
                    rows={6}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className={`${styles.actionBtn} ${styles.primaryBtn}`}
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                    >
                        {savingNotes ? 'Salvando...' : 'Salvar Observações'}
                    </button>
                </div>
            </section>

            {/* 6. Histórico / Auditoria */}
            <section className={styles.card}>
                <div className={styles.cardTitle}>
                    <History size={20} />
                    Histórico de Alterações
                </div>
                <ul className={styles.auditLog}>
                    {auditLogs.map((log) => (
                        <li key={log.id} className={styles.auditItem}>
                            <div className={styles.auditHeader}>
                                <span className={styles.auditUser}>{log.user_name || 'Sistema'}</span>
                                <span className={styles.auditDate}>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className={styles.auditAction}>{log.action}</div>
                            <div className={styles.auditDetails}>{log.details}</div>
                        </li>
                    ))}
                    {auditLogs.length === 0 && <p style={{ color: '#94a3b8' }}>Nenhum registro de histórico.</p>}
                </ul>
            </section>
        </div>
    );
};

export default ProfessionalDetail;
