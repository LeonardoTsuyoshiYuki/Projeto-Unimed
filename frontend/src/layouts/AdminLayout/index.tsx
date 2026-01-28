import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './styles.module.css';
import { Button } from '../../components/ui/Button';
import { Moon, Sun, LogOut } from 'lucide-react';

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
                    <Button onClick={toggleTheme} variant="ghost" style={{ width: '100%', marginBottom: '1rem', justifyContent: 'flex-start' }}>
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        <span style={{ marginLeft: '10px' }}>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </Button>
                    <Button onClick={logout} variant="outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        <LogOut size={18} />
                        <span style={{ marginLeft: '10px' }}>Sair</span>
                    </Button>
                </div>
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};
