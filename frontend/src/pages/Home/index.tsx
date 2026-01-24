import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';
import { Button } from '../../components/ui/Button';

export const Home: React.FC = () => {
    return (
        <div className={styles.hero}>
            <h1>Credenciamento de Profissionais</h1>
            <p>
                Junte-se à maior rede de saúde do Brasil. Realize seu cadastro online
                de forma rápida, segura e 100% digital.
            </p>

            <div className={styles.actions}>
                <Link to="/register">
                    <Button>Iniciar Credenciamento</Button>
                </Link>
                <Link to="/admin">
                    <Button variant="outline">Acesso Administrativo</Button>
                </Link>
            </div>

            <div className={styles.features}>
                <div className={styles.feature}>
                    <h3>100% Digital</h3>
                    <p>Envie seus documentos sem sair de casa.</p>
                </div>
                <div className={styles.feature}>
                    <h3>Seguro</h3>
                    <p>Seus dados protegidos conforme a LGPD.</p>
                </div>
                <div className={styles.feature}>
                    <h3>Ágil</h3>
                    <p>Acompanhe o status da sua solicitação por e-mail.</p>
                </div>
            </div>
        </div>
    );
};
