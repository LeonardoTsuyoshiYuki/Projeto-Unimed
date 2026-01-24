import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './styles.module.css';
import api from '../../services/api';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/token/', { username, password });
            localStorage.setItem('token', response.data.access);
            navigate('/admin/dashboard');
        } catch (err) {
            alert('Credenciais inválidas');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <h2>Acesso Administrativo</h2>
            <form onSubmit={handleLogin} className={styles.form}>
                <Input
                    label="Usuário"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <Input
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <Button type="submit">Entrar</Button>
            </form>
        </div>
    );
};
