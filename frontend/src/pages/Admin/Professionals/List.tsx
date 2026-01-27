import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import styles from './styles.module.css';

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

            const response = await api.get('/professionals/', { params });
            setProfessionals(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching professionals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessionals();
    }, [search, statusFilter]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
    };

    const handleExport = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/professionals/export_excel/', {
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Profissionais Cadastrados</h2>
                <button onClick={handleExport} className={styles.exportBtn}>
                    📊 Exportar Excel
                </button>
            </div>

            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Buscar por nome, CPF, email..."
                    value={search}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                />
                <select value={statusFilter} onChange={handleStatusChange} className={styles.selectInput}>
                    <option value="">Todos os Status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="REJECTED">Rejeitado</option>
                    <option value="NEEDS_ADJUSTMENT">Requer Ajustes</option>
                </select>
            </div>
        </div>

            {
        loading ? (
            <p>Carregando...</p>
        ) : (
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Formação</th>
                        <th>Data Envio</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {professionals.map((prof) => (
                        <tr key={prof.id}>
                            <td>{prof.name}</td>
                            <td>{prof.education}</td>
                            <td>{new Date(prof.submission_date).toLocaleDateString()}</td>
                            <td>
                                <span className={`${styles.statusBadge} ${styles[prof.status]}`}>
                                    {prof.status}
                                </span>
                            </td>
                            <td>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => navigate(`/admin/professionals/${prof.id}`)}
                                >
                                    Detalhes
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
        </div >
    );
};

export default ProfessionalsList;
