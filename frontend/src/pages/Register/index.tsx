import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './styles.module.css';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(11, "CPF deve ter 11 dígitos (apenas números)"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    consent_given: z.boolean().refine(val => val === true, "Você deve aceitar os termos da LGPD"),
});

type FormData = z.infer<typeof schema>;

export const Register: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });
    const [files, setFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files);
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!files || files.length === 0) {
            setGeneralError("Por favor, anexe pelo menos um documento.");
            return;
        }

        // Check file size
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > 5 * 1024 * 1024) {
                setGeneralError(`O arquivo ${files[i].name} excede o limite de 5MB.`);
                return;
            }
        }

        setIsLoading(true);
        setGeneralError('');

        try {
            // 1. Create Professional
            const response = await api.post('/professionals/', {
                ...data,
                consent_given: true // Reinforced
            });

            const professionalId = response.data.id;

            // 2. Upload Files
            const fileUploads = Array.from(files).map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('professional', professionalId); // ID relation
                formData.append('description', 'Documento de Habilitação'); // Default description
                return api.post('/documents/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            });

            await Promise.all(fileUploads);

            alert("Cadastro realizado com sucesso! Verifique seu e-mail.");
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.response?.data) {
                // Handle backend errors (like duplicate 90 days)
                const msg = JSON.stringify(err.response.data);
                setGeneralError(msg.includes("CPF") ? "Já existe uma solicitação para este CPF recente." : "Erro ao enviar cadastro.");
            } else {
                setGeneralError("Erro de conexão. Tente novamente.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2>Formulário de Credenciamento</h2>
            <p className={styles.subtitle}>Preencha seus dados e anexe os documentos comprobatórios.</p>

            {generalError && (
                <div className={styles.errorAlert}>
                    {generalError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <Input
                    label="Nome Completo"
                    placeholder="Ex: Dr. João Silva"
                    {...register('name')}
                    error={errors.name?.message}
                />

                <div className={styles.row}>
                    <Input
                        label="CPF (somente números)"
                        placeholder="00000000000"
                        maxLength={11}
                        {...register('cpf')}
                        error={errors.cpf?.message}
                    />
                    <Input
                        label="Telefone/Celular"
                        placeholder="(00) 00000-0000"
                        {...register('phone')}
                        error={errors.phone?.message}
                    />
                </div>

                <Input
                    label="E-mail Profissional"
                    type="email"
                    placeholder="email@exemplo.com"
                    {...register('email')}
                    error={errors.email?.message}
                />

                <div className={styles.fileSection}>
                    <label className={styles.fileLabel}>Documentos (PDF, JPG, PNG)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={handleFileChange}
                        className={styles.fileInput}
                    />
                    <p className={styles.hint}>Tamanho máx: 5MB por arquivo.</p>
                </div>

                <div className={styles.consent}>
                    <input
                        type="checkbox"
                        id="consent"
                        {...register('consent_given')}
                    />
                    <label htmlFor="consent">
                        Declaro que li e aceito o tratamento dos meus dados pessoais conforme a <a href="#">Política de Privacidade</a> e LGPD.
                    </label>
                </div>
                {errors.consent_given && <span className={styles.errorMessage}>{errors.consent_given.message}</span>}

                <Button type="submit" isLoading={isLoading} className={styles.submitBtn}>
                    Enviar Solicitação
                </Button>
            </form>
        </div>
    );
};
