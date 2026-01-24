import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'var(--color-primary)' }) => {
    return (
        <div
            className={`${styles.spinner} ${styles[size]}`}
            style={{ borderTopColor: color }}
            role="status"
            aria-label="Carregando..."
        />
    );
};
