import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './Layout.module.css';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const Layout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.logo}>
                        <h1>Unimed</h1>
                        <span className={styles.badge}>Credenciamento</span>
                    </div>
                    <nav className={styles.nav}>
                        <Link to="/">Início</Link>
                        <Link to="/register">Quero me Credenciar</Link>
                        <Link to="/admin">Área Administrativa</Link>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--text-secondary)'
                            }}
                            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </nav>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.container}>
                    <Outlet />
                </div>
            </main>

            <footer className={styles.footer}>
                <div className={styles.container}>
                    <p>© 2026 Unimed - Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};
