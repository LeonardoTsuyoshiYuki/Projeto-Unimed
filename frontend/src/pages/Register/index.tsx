import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import styles from './styles.module.css';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const educationOptions = [
    'Agente Comunitário de Saúde', 'Agente de Combate às Endemias', 'Acompanhante Terapêutico',
    'Administrador Hospitalar', 'Analista de Regulação em Saúde', 'Antropólogo da Saúde',
    'Aromaterapeuta', 'Arteterapeuta', 'Assistente Social (na saúde)', 'Audiologista',
    'Auxiliar de Enfermagem', 'Auxiliar de Farmácia', 'Auxiliar de Saúde Bucal', 'Bioquímico',
    'Biomédico', 'Biólogo (atuando na saúde)', 'Citotécnico', 'Cosmetólogo', 'Cuidador de Idosos',
    'Dentista (Cirurgião-Dentista)', 'Dosimetrista', 'Doula', 'Educador Físico (Bacharel)',
    'Educador em Saúde', 'Enfermeiro', 'Engenheiro Biomédico', 'Epidemiologista', 'Esteticista',
    'Farmacêutico', 'Farmacêutico Clínico', 'Farmacêutico Hospitalar', 'Farmacêutico Industrial',
    'Fisioterapeuta', 'Fonoaudiólogo', 'Gerontólogo', 'Gestor Hospitalar', 'Gestor em Saúde',
    'Histotécnico', 'Massoterapeuta', 'Musicoterapeuta', 'Naturopata', 'Nutricionista',
    'Obstetriz', 'Optometrista', 'Óptico', 'Operador de Raios-X', 'Ortesista e Protesista',
    'Osteopata', 'Parteira Tradicional', 'Patologista Clínico (não médico)', 'Podólogo',
    'Protético Dentário', 'Psicanalista', 'Psicólogo', 'Quiropraxista', 'Radiologista Tecnólogo',
    'Reflexoterapeuta', 'Sanitarista', 'Sociólogo da Saúde', 'Técnico em Administração Hospitalar',
    'Técnico em Análises Clínicas', 'Técnico em Audiometria', 'Técnico em Banco de Sangue',
    'Técnico em Enfermagem', 'Técnico em Equipamentos Biomédicos', 'Técnico em Farmácia',
    'Técnico em Gerontologia', 'Técnico em Hemoterapia', 'Técnico em Histologia',
    'Técnico em Imobilizações Ortopédicas', 'Técnico em Imagenologia', 'Técnico em Nutrição e Dietética',
    'Técnico em Óptica', 'Técnico em Prótese Dentária', 'Técnico em Radiologia',
    'Técnico em Registros e Informações em Saúde', 'Técnico em Saúde Bucal', 'Técnico em Saúde Pública',
    'Técnico em Vigilância em Saúde', 'Tecnólogo em Análises Clínicas', 'Tecnólogo em Estética e Cosmética',
    'Tecnólogo em Oftálmica', 'Tecnólogo em Radiologia', 'Tecnólogo em Saúde Pública',
    'Tecnólogo em Sistemas Biomédicos', 'Terapeuta Cognitivo-Comportamental', 'Terapeuta Familiar',
    'Terapeuta Holístico', 'Terapeuta Integrativo', 'Terapeuta Ocupacional',
    'Outros'
];

const schema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cpf: z.string().length(11, "CPF deve ter 11 dígitos (apenas números)"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(10, "Telefone inválido"),

    // Personal Data
    birth_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),

    // Address Data
    zip_code: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
    street: z.string().min(3, "Logradouro obrigatório"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro obrigatório"),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF inválida"),

    // Professional Data
    education: z.string().nonempty("Selecione sua formação acadêmica"),
    custom_education: z.string().optional(),
    institution: z.string().min(2, "Instituição é obrigatória"),
    graduation_year: z.string().regex(/^\d{4}$/, "Ano deve ter 4 dígitos"),
    council_name: z.string().nonempty("Conselho é obrigatório (ex: CRM, COREN)"),
    council_number: z.string().nonempty("Número do conselho é obrigatório"),
    area_of_action: z.string().optional(),
    experience_years: z.string().regex(/^\d+$/, "Apenas números"),

    consent_given: z.boolean().refine(val => val === true, "Você deve aceitar os termos da LGPD"),
}).superRefine((data, ctx) => {
    if (data.education === 'Outros' && !data.custom_education) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['custom_education'],
            message: 'Digite sua formação'
        });
    }
});

type FormData = z.infer<typeof schema>;

export const Register: React.FC = () => {
    const { register, handleSubmit, setValue, setFocus, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });
    const [files, setFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const navigate = useNavigate();

    const selectedEducation = watch('education');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files);
        }
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                if (response.data.erro) {
                    setGeneralError("CEP não encontrado.");
                    return;
                }
                setValue('street', response.data.logradouro);
                setValue('neighborhood', response.data.bairro);
                setValue('city', response.data.localidade);
                setValue('state', response.data.uf);
                setFocus('number'); // Move focus to Number
                setGeneralError('');
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
                setGeneralError("Erro ao buscar CEP. Verifique sua conexão.");
            }
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
            // Determine final education value
            const finalEducation = data.education === 'Outros'
                ? data.custom_education
                : data.education;

            // 1. Create Professional
            const response = await api.post('/professionals/', {
                ...data,
                graduation_year: parseInt(data.graduation_year.toString(), 10),
                experience_years: parseInt(data.experience_years.toString(), 10),
                education: finalEducation,
                consent_given: true
            });

            const professionalId = response.data.id;

            // 2. Upload Files
            const fileUploads = Array.from(files).map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('professional', professionalId);
                formData.append('description', 'Documento de Habilitação');
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
                const msg = JSON.stringify(err.response.data);
                setGeneralError(msg.includes("CPF") ? "Já existe uma solicitação para este CPF recente." : "Erro ao enviar cadastro. Verifique os dados.");
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
            <p className={styles.subtitle}>Preencha todos os dados obrigatórios para iniciar sua análise.</p>

            {generalError && (
                <div className={styles.errorAlert}>
                    {generalError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                {/* Dados Pessoais */}
                <h3 className={styles.sectionTitle}>Dados Pessoais</h3>

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
                        label="Data de Nascimento"
                        type="date"
                        {...register('birth_date')}
                        error={errors.birth_date?.message}
                    />
                </div>

                <div className={styles.row}>
                    <Input
                        label="Telefone/Celular"
                        placeholder="(00) 00000-0000"
                        {...register('phone')}
                        error={errors.phone?.message}
                    />
                    <Input
                        label="E-mail Profissional"
                        type="email"
                        placeholder="email@exemplo.com"
                        {...register('email')}
                        error={errors.email?.message}
                    />
                </div>

                {/* Endereço */}
                <h3 className={styles.sectionTitle}>Endereço</h3>

                <div className={styles.row}>
                    <Input
                        label="CEP (somente números)"
                        placeholder="00000000"
                        maxLength={8}
                        {...register('zip_code')}
                        onBlur={handleCepBlur}
                        error={errors.zip_code?.message}
                    />
                    <Input
                        label="Cidade"
                        placeholder="..."
                        readOnly
                        {...register('city')}
                        error={errors.city?.message}
                    />
                    <Input
                        label="UF"
                        placeholder=".."
                        readOnly
                        maxLength={2}
                        {...register('state')}
                        error={errors.state?.message}
                    />
                </div>

                <div className={styles.row}>
                    <Input
                        label="Logradouro"
                        placeholder="..."
                        readOnly
                        {...register('street')}
                        error={errors.street?.message}
                    />
                    <Input
                        label="Número"
                        placeholder="123"
                        {...register('number')}
                        error={errors.number?.message}
                    />
                </div>

                <div className={styles.row}>
                    <Input
                        label="Bairro"
                        placeholder="..."
                        readOnly
                        {...register('neighborhood')}
                        error={errors.neighborhood?.message}
                    />
                    <Input
                        label="Complemento (Opcional)"
                        placeholder="Apto 101"
                        {...register('complement')}
                        error={errors.complement?.message}
                    />
                </div>


                {/* Dados Profissionais */}
                <h3 className={styles.sectionTitle}>Dados Profissionais</h3>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Formação Acadêmica</label>
                    <select
                        {...register('education')}
                        className={styles.selectInput}
                    >
                        <option value="">Selecione sua formação...</option>
                        {educationOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                        ))}
                    </select>
                    {errors.education && <span className={styles.errorMessage}>{errors.education.message}</span>}
                </div>

                {selectedEducation === 'Outros' && (
                    <Input
                        label="Qual sua formação?"
                        placeholder="Digite sua formação profissional"
                        {...register('custom_education')}
                        error={errors.custom_education?.message}
                    />
                )}

                <div className={styles.row}>
                    <Input
                        label="Instituição de Ensino"
                        placeholder="Ex: USP, UNIFESP"
                        {...register('institution')}
                        error={errors.institution?.message}
                    />
                    <Input
                        label="Ano Conclusão"
                        placeholder="2020"
                        maxLength={4}
                        {...register('graduation_year')}
                        error={errors.graduation_year?.message}
                    />
                </div>

                <div className={styles.row}>
                    <Input
                        label="Conselho de Classe"
                        placeholder="Ex: CRM-SP"
                        {...register('council_name')}
                        error={errors.council_name?.message}
                    />
                    <Input
                        label="Número Inscrição"
                        placeholder="123456"
                        {...register('council_number')}
                        error={errors.council_number?.message}
                    />
                </div>

                <div className={styles.row}>
                    <Input
                        label="Tempo de Experiência (anos)"
                        type="number"
                        placeholder="Ex: 5"
                        {...register('experience_years')}
                        error={errors.experience_years?.message}
                    />
                    <Input
                        label="Área de Atuação (Opcional)"
                        placeholder="Ex: Urgência e Emergência"
                        {...register('area_of_action')}
                        error={errors.area_of_action?.message}
                    />
                </div>

                <div className={styles.fileSection}>
                    <label className={styles.fileLabel}>Documentos Comprobatórios (PDF, JPG, PNG)</label>
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
