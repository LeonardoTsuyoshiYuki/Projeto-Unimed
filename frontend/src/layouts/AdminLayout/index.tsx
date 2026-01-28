import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './styles.module.css';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const AdminLayout: React.FC = () => {
    const { isAuthenticated, loading, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className={styles.adminLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>Unimed Admin</div>
                <nav>
                    <Link to="/admin/dashboard" className={styles.navLink}>Dashboard</Link>
                    <Link to="/admin/professionals" className={styles.navLink}>Profissionais</Link>
                </nav>
                <div className={styles.logout}>
                    <button
                        onClick={toggleTheme}
                        className={styles.themeToggle}
                        title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                    <Button onClick={logout} variant="outline" style={{ width: '100%' }}>Sair</Button>
                </div>
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};
