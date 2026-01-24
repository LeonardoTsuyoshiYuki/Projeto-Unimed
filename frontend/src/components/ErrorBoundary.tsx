import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // We can also log to an external service here
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100vh', padding: '2rem',
                    textAlign: 'center', backgroundColor: '#f8fafc', color: '#1e293b'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#dc2626' }}>
                        Ops! Algo inesperado aconteceu.
                    </h1>
                    <p style={{ marginBottom: '2rem', color: '#64748b' }}>
                        Nossa equipe foi notificada. Por favor, recarregue a página.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
