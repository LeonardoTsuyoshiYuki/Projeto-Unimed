
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import api from '../../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#FFBB28'];

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
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [metricsRes, listRes] = await Promise.all([
                api.get('/admin/dashboard/'),
                api.get('/professionals/')
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
            <div className={styles.loadingContainer}>
                <Spinner size="lg" color="var(--color-secondary)" />
                <p>Carregando painel...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <h3>Ops! Algo deu errado.</h3>
                <p>{error}</p>
                <Button onClick={fetchData}>Tentar Novamente</Button>
            </div>
        );
    }

    if (!metrics) return null;

    // Transform Data for Charts
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

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1>Dashboard Administrativo</h1>
                    <p>Visão geral de credenciamentos e métricas</p>
                </div>
                <Button onClick={fetchData}>Atualizar</Button>
            </header>

            {/* KPI Cards */}
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Total</h3>
                    <p className={styles.bigNumber}>{metrics.total_registrations}</p>
                    <span className={styles.label}>Cadastros Totais</span>
                </div>
                <div className={styles.card}>
                    <h3>Pendentes</h3>
                    <p className={`${styles.bigNumber} ${styles.warning} `}>{pending}</p>
                    <span className={styles.label}>Aguardando Análise</span>
                </div>
                <div className={styles.card}>
                    <h3>Aprovados</h3>
                    <p className={`${styles.bigNumber} ${styles.success} `}>{approved}</p>
                    <span className={styles.label}>Credenciados</span>
                </div>
                <div className={styles.card}>
                    <h3>Reprovados</h3>
                    <p className={`${styles.bigNumber} ${styles.error} `}>{rejected}</p>
                    <span className={styles.label}>Negados</span>
                </div>
                <div className={styles.card}>
                    <h3>Ajustes</h3>
                    <p className={`${styles.bigNumber} ${styles.info} `}>{adjustment}</p>
                    <span className={styles.label}>Solicitados</span>
                </div>
                <div className={styles.card}>
                    <h3>Recentes</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p className={styles.bigNumber} style={{ fontSize: '1.5rem' }}>{metrics.last_30_days}</p>
                            <span className={styles.label} style={{ fontSize: '0.7rem' }}>30d</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p className={styles.bigNumber} style={{ fontSize: '1.5rem' }}>{metrics.last_60_days}</p>
                            <span className={styles.label} style={{ fontSize: '0.7rem' }}>60d</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p className={styles.bigNumber} style={{ fontSize: '1.5rem' }}>{metrics.last_90_days}</p>
                            <span className={styles.label} style={{ fontSize: '0.7rem' }}>90d</span>
                        </div>
                    </div>
                </div>
                <div className={styles.card}>
                    <h3>Eficiência</h3>
                    <p className={`${styles.bigNumber} ${styles.info}`}>{metrics.analyzed_this_month}</p>
                    <span className={styles.label}>Análises no Mês</span>
                </div>
                <div className={styles.card}>
                    <h3>Tempo Médio</h3>
                    <p className={styles.bigNumber}>{metrics.avg_analysis_time_days} <span style={{ fontSize: '0.5em' }}>dias</span></p>
                    <span className={styles.label}>Cadastro → Decisão</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className={styles.chartsRow}>
                <div className={styles.chartContainer}>
                    <h4>Evolução de Cadastros</h4>
                    {areaData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={areaData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="registrations" stroke="#0088FE" fill="#0088FE" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>Sem dados suficientes para o período.</div>
                    )}
                </div>

                <div className={styles.chartContainer}>
                    <h4>Distribuição por Status</h4>
                    {pieData.length > 0 && metrics.total_registrations > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>Nenhum cadastro para exibir.</div>
                    )}
                </div>
            </div>

            {/* Recent Registrations Table */}
            <div className={styles.tableSection}>
                <h4>Solicitações Recentes</h4>
                {professionals.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF</th>
                                <th>Data</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {professionals.slice(0, 5).map(prof => (
                                <tr key={prof.id}>
                                    <td>{prof.name}</td>
                                    <td>{prof.cpf}</td>
                                    <td>{new Date(prof.submission_date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[prof.status.toLowerCase()]} `}>
                                            {prof.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={styles.emptyState}>Nenhuma solicitação encontrada.</p>
                )}
            </div>
        </div>
    );
};
