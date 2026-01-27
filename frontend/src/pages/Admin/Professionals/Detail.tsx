import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import styles from './styles.module.css';

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
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar observações.");
        } finally {
            setSavingNotes(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!professional) return;

        const confirmMsg = `Tem certeza que deseja mudar o status para ${newStatus}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await api.patch(`/professionals/${professional.id}/`, { status: newStatus });

            // Refresh data
            const [profRes, logsRes] = await Promise.all([
                api.get(`/professionals/${id}/`),
                api.get(`/professionals/${id}/history/`)
            ]);
            setProfessional(profRes.data);
            setAuditLogs(logsRes.data);
            alert("Status atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar status.");
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (!professional) return <div>Profissional não encontrado.</div>;


    return (
        <div className={styles.container}>
            <div className={styles.detailHeader}>
                <button onClick={() => navigate('/admin/professionals')} className={styles.actionButton}>
                    &larr; Voltar
                </button>
                <h2>Detalhes: {professional.name}</h2>
                <span className={`${styles.statusBadge} ${styles[professional.status]}`}>
                    {professional.status}
                </span>
            </div>

            <div className={styles.section}>
                <h3>Dados Pessoais</h3>
                <div className={styles.grid}>
                    <div className={styles.field}><span className={styles.label}>CPF</span><span className={styles.value}>{professional.cpf}</span></div>
                    <div className={styles.field}><span className={styles.label}>Email</span><span className={styles.value}>{professional.email}</span></div>
                    <div className={styles.field}><span className={styles.label}>Telefone</span><span className={styles.value}>{professional.phone}</span></div>
                    <div className={styles.field}><span className={styles.label}>Nascimento</span><span className={styles.value}>{professional.birth_date}</span></div>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Endereço</h3>
                <div className={styles.grid}>
                    <div className={styles.field}><span className={styles.label}>CEP</span><span className={styles.value}>{professional.zip_code}</span></div>
                    <div className={styles.field}><span className={styles.label}>Cidade/UF</span><span className={styles.value}>{professional.city}/{professional.state}</span></div>
                    <div className={styles.field}><span className={styles.label}>Logradouro</span><span className={styles.value}>{professional.street}, {professional.number}</span></div>
                    <div className={styles.field}><span className={styles.label}>Bairro</span><span className={styles.value}>{professional.neighborhood}</span></div>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Dados Profissionais</h3>
                <div className={styles.grid}>
                    <div className={styles.field}><span className={styles.label}>Formação</span><span className={styles.value}>{professional.education}</span></div>
                    <div className={styles.field}><span className={styles.label}>Instituição</span><span className={styles.value}>{professional.institution} ({professional.graduation_year})</span></div>
                    <div className={styles.field}><span className={styles.label}>Conselho</span><span className={styles.value}>{professional.council_name}: {professional.council_number}</span></div>
                    <div className={styles.field}><span className={styles.label}>Experiência</span><span className={styles.value}>{professional.experience_years} anos</span></div>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Documentos Comprobatórios</h3>
                <div className={styles.grid}>
                    {(!professional.documents || professional.documents.length === 0) ? (
                        <p>Nenhum documento enviado.</p>
                    ) : (
                        <ul className={styles.documentList}>
                            {professional.documents.map((doc) => (
                                <li key={doc.id} className={styles.documentItem}>
                                    <div className={styles.docInfo}>
                                        <span className={styles.docName}>
                                            {doc.file.split('/').pop()}
                                            <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '8px' }}>
                                                ({doc.file.split('.').pop()?.toUpperCase()})
                                            </span>
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.85em', color: '#555' }}>{doc.description}</span>
                                        <span className={styles.docDate}>Enviado em: {new Date(doc.uploaded_at).toLocaleString()}</span>
                                    </div>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={async () => {
                                            try {
                                                const response = await api.get(`/documents/${doc.id}/download/`, {
                                                    responseType: 'blob'
                                                });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                const filename = doc.file.split('/').pop() || 'documento';
                                                link.setAttribute('download', filename);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.parentNode?.removeChild(link);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Erro ao baixar documento.');
                                            }
                                        }}
                                    >
                                        Baixar Arquivo
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <h3>Observações Internas (Admin)</h3>
                <textarea
                    className={styles.notesArea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Registre aqui observações internas, decisões ou pendências..."
                    rows={4}
                />
                <button
                    className={styles.saveNotesBtn}
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                >
                    {savingNotes ? 'Salvando...' : 'Salvar Observações'}
                </button>
            </div>

            <div className={styles.section}>
                <h3>Ações Administrativas</h3>
                <div className={styles.actionPanel}>
                    <button className={styles.approveBtn} onClick={() => handleStatusChange('APPROVED')}>Aprovar</button>
                    <button className={styles.rejectBtn} onClick={() => handleStatusChange('REJECTED')}>Rejeitar</button>
                    <button className={styles.adjustmentBtn} onClick={() => handleStatusChange('NEEDS_ADJUSTMENT')}>Solicitar Ajustes</button>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Histórico de Alterações</h3>
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
                    {auditLogs.length === 0 && <p>Nenhum histórico encontrado.</p>}
                </ul>
            </div>
        </div >
    );
};

export default ProfessionalDetail;
