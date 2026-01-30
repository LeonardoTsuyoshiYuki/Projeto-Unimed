import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    TextField,
    Typography,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { publicApi } from '../../services/api';

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
    birth_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
    zip_code: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
    street: z.string().min(3, "Logradouro obrigatório"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro obrigatório"),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF inválida"),
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
                setFocus('number');
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

        for (let i = 0; i < files.length; i++) {
            if (files[i].size > 5 * 1024 * 1024) {
                setGeneralError(`O arquivo ${files[i].name} excede o limite de 5MB.`);
                return;
            }
        }

        setIsLoading(true);
        setGeneralError('');

        try {
            const finalEducation = data.education === 'Outros' ? data.custom_education : data.education;

            const response = await publicApi.post('/professionals/', {
                ...data,
                graduation_year: parseInt(data.graduation_year.toString(), 10),
                experience_years: parseInt(data.experience_years.toString(), 10),
                education: finalEducation,
                consent_given: true
            });

            const professionalId = response.data.id;

            const fileUploads = Array.from(files).map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('professional', professionalId);
                formData.append('description', 'Documento de Habilitação');
                return publicApi.post('/documents/', formData, {
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
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: 3 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                        Credenciamento
                    </Typography>
                    <Typography color="text.secondary">
                        Preencha o formulário para se juntar à nossa rede de profissionais.
                    </Typography>
                </Box>

                {generalError && (
                    <Alert severity="error" sx={{ mb: 3 }} icon={<AlertCircle />}>
                        {generalError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                        Dados Pessoais
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Nome Completo" placeholder="Ex: Dr. João Silva" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="CPF (somente números)" placeholder="00000000000" inputProps={{ maxLength: 11 }} {...register('cpf')} error={!!errors.cpf} helperText={errors.cpf?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth type="date" label="Data de Nascimento" InputLabelProps={{ shrink: true }} {...register('birth_date')} error={!!errors.birth_date} helperText={errors.birth_date?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Telefone/Celular" placeholder="(00) 00000-0000" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="E-mail Profissional" type="email" placeholder="email@exemplo.com" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                        Endereço
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth label="CEP" placeholder="00000000" inputProps={{ maxLength: 8 }} {...register('zip_code')} onBlur={handleCepBlur} error={!!errors.zip_code} helperText={errors.zip_code?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Cidade" InputProps={{ readOnly: true }} {...register('city')} error={!!errors.city} helperText={errors.city?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField fullWidth label="UF" InputProps={{ readOnly: true }} {...register('state')} error={!!errors.state} helperText={errors.state?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 9 }}>
                            <TextField fullWidth label="Logradouro" InputProps={{ readOnly: true }} {...register('street')} error={!!errors.street} helperText={errors.street?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField fullWidth label="Número" {...register('number')} error={!!errors.number} helperText={errors.number?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Bairro" InputProps={{ readOnly: true }} {...register('neighborhood')} error={!!errors.neighborhood} helperText={errors.neighborhood?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Complemento" {...register('complement')} />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                        Dados Profissionais
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField select fullWidth label="Formação Acadêmica" defaultValue="" {...register('education')} error={!!errors.education} helperText={errors.education?.message}>
                                {educationOptions.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        {selectedEducation === 'Outros' && (
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Qual sua formação?" placeholder="Digite sua formação" {...register('custom_education')} error={!!errors.custom_education} helperText={errors.custom_education?.message} />
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField fullWidth label="Instituição de Ensino" placeholder="Ex: USP" {...register('institution')} error={!!errors.institution} helperText={errors.institution?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth label="Ano Conclusão" placeholder="2020" inputProps={{ maxLength: 4 }} {...register('graduation_year')} error={!!errors.graduation_year} helperText={errors.graduation_year?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Conselho de Classe" placeholder="Ex: CRM-SP" {...register('council_name')} error={!!errors.council_name} helperText={errors.council_name?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Número Inscrição" placeholder="123456" {...register('council_number')} error={!!errors.council_number} helperText={errors.council_number?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Tempo de Experiência (anos)" type="number" placeholder="Ex: 5" {...register('experience_years')} error={!!errors.experience_years} helperText={errors.experience_years?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Área de Atuação (Opcional)" placeholder="Ex: Cardiologia" {...register('area_of_action')} />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                        Documentação
                    </Typography>

                    <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<Upload />}
                            size="large"
                        >
                            Selecionar Arquivos (PDF, JPG, PNG)
                            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileChange} />
                        </Button>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            Tamanho máximo: 5MB por arquivo.
                        </Typography>
                        {files && files.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                {Array.from(files).map((file, idx) => (
                                    <Typography key={idx} variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                        <CheckCircle size={14} /> {file.name}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <FormControlLabel
                            control={<Checkbox {...register('consent_given')} />}
                            label={<Typography variant="body2" color="text.secondary">Declaro que li e aceito o tratamento dos meus dados pessoais conforme a Política de Privacidade e LGPD.</Typography>}
                        />
                        {errors.consent_given && <Typography color="error" variant="caption" display="block">{errors.consent_given.message}</Typography>}
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={isLoading}
                        sx={{ mt: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Solicitação'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};
