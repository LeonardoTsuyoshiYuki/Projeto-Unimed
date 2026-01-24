import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './Layout.module.css';

export const Layout: React.FC = () => {
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
