import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { Button } from '../../../components/ui/Button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import api from '../../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface DashboardMetrics {
    total_registrations: number;
    last_30_days: number;
    status_counts: { status: string; count: number }[];
    yearly_variation: { month: string; count: number }[];
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
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const [metricsRes, listRes] = await Promise.all([
                    api.get('/admin/dashboard/'),
                    api.get('/professionals/')
                ]);
                setMetrics(metricsRes.data);
                setProfessionals(listRes.data.results || listRes.data);
            } catch (err) {
                console.error(err);
                // navigate('/admin'); 
            }
        };
        fetch();
    }, [navigate]);

    if (!metrics) return <div>Carregando...</div>;

    // Transform Data for Charts
    const pieData = metrics.status_counts.map(item => ({
        name: item.status,
        value: item.count
    }));

    const areaData = metrics.yearly_variation.map(item => ({
        name: new Date(item.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        registrations: item.count
    }));

    const pending = metrics.status_counts.find(s => s.status === 'PENDING')?.count || 0;
    const approved = metrics.status_counts.find(s => s.status === 'APPROVED')?.count || 0;
    const rejected = metrics.status_counts.find(s => s.status === 'REJECTED')?.count || 0;
    const adjustment = metrics.status_counts.find(s => s.status === 'ADJUSTMENT_REQUESTED')?.count || 0;

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h2>Painel Administrativo</h2>
                <Button variant="outline" onClick={() => navigate('/admin')}>Sair</Button>
            </header>

            {/* KPI Cards */}
            {/* KPI Cards */}
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Total</h3>
                    <p className={styles.bigNumber}>{metrics.total_registrations}</p>
                    <span className={styles.label}>Cadastros</span>
                </div>
                <div className={styles.card}>
                    <h3>Pendente</h3>
                    <p className={`${styles.bigNumber} ${styles.warning}`}>{pending}</p>
                    <span className={styles.label}>Aguardando</span>
                </div>
                <div className={styles.card}>
                    <h3>Aprovados</h3>
                    <p className={`${styles.bigNumber} ${styles.success}`}>{approved}</p>
                    <span className={styles.label}>Concluídos</span>
                </div>
                <div className={styles.card}>
                    <h3>Reprovados</h3>
                    <p className={`${styles.bigNumber} ${styles.error}`}>{rejected}</p>
                    <span className={styles.label}>Negados</span>
                </div>
                <div className={styles.card}>
                    <h3>Ajustes</h3>
                    <p className={styles.bigNumber}>{adjustment}</p>
                    <span className={styles.label}>Solicitados</span>
                </div>
                <div className={styles.card}>
                    <h3>Últimos 30 dias</h3>
                    <p className={styles.bigNumber}>{metrics.last_30_days}</p>
                    <span className={styles.label}>Novos</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className={styles.chartsRow}>
                <div className={styles.chartContainer}>
                    <h4>Variação de Custo (Volume Mensal)</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={areaData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="registrations" stroke="#00995D" fill="#DCFCE7" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartContainer}>
                    <h4>Distribuição de Status</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className={styles.tableSection}>
                <h4>Cadastros Recentes</h4>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Data</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {professionals.slice(0, 5).map(p => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{p.cpf}</td>
                                <td>{new Date(p.submission_date).toLocaleDateString()}</td>
                                <td>
                                    <span className={`${styles.status} ${styles[p.status.toLowerCase()]}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>
                                    <Button variant="ghost">Detalhes</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
