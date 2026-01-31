import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
    RadioGroup,
    Radio,
    FormControl,
    FormLabel,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Upload, CheckCircle, AlertCircle, Search, Check, AlertTriangle } from 'lucide-react';
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
    person_type: z.enum(['PF', 'PJ']),
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    company_name: z.string().optional(),
    technical_manager_name: z.string().optional(),
    technical_manager_cpf: z.string().optional(),
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

    if (data.person_type === 'PF') {
        if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cpf'],
                message: 'CPF obrigatório e deve ter 11 dígitos'
            });
        }
    } else {
        if (!data.cnpj || data.cnpj.replace(/\D/g, '').length !== 14) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['cnpj'],
                message: 'CNPJ obrigatório e deve ter 14 dígitos'
            });
        }
        if (!data.technical_manager_name) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['technical_manager_name'],
                message: 'Nome do Responsável Técnico é obrigatório'
            });
        }
        if (!data.technical_manager_cpf) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['technical_manager_cpf'],
                message: 'CPF do Responsável Técnico é obrigatório'
            });
        }
    }
});

type RegisterFormData = z.infer<typeof schema>;

export const Register: React.FC = () => {
    const { register, handleSubmit, setValue, setFocus, watch, control, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            person_type: 'PF'
        }
    });

    const personType = watch('person_type');

    const [files, setFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState<{ valid: boolean, message: string, status: string } | null>(null);
    const [isValidatingCnpj, setIsValidatingCnpj] = useState(false);
    const navigate = useNavigate();

    const selectedEducation = watch('education');
    const cnpjValue = watch('cnpj');

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

    const validateCNPJ = async () => {
        if (!cnpjValue || cnpjValue.replace(/\D/g, '').length !== 14) {
            setCnpjStatus({ valid: false, message: 'Digite um CNPJ válido (14 dígitos)', status: 'INVALID' });
            return;
        }

        setIsValidatingCnpj(true);
        setCnpjStatus(null);
        try {
            const response = await publicApi.get(`/api/validate-cnpj/?cnpj=${cnpjValue}`);
            const { valid, message, status } = response.data;
            setCnpjStatus({ valid, message, status });
        } catch (error) {
            setCnpjStatus({ valid: false, message: 'Erro ao validar CNPJ.', status: 'ERROR' });
        } finally {
            setIsValidatingCnpj(false);
        }
    };

    const onSubmit = async (data: RegisterFormData) => {
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

        if (data.person_type === 'PJ' && cnpjStatus && !cnpjStatus.valid) {
            setGeneralError("Não é possível prosseguir com CNPJ irregular.");
            return;
        }

        setIsLoading(true);
        setGeneralError('');

        try {
            const finalEducation = data.education === 'Outros' ? data.custom_education : data.education;

            const payload: any = {
                ...data,
                graduation_year: parseInt(data.graduation_year.toString(), 10),
                experience_years: parseInt(data.experience_years.toString(), 10),
                education: finalEducation,
                consent_given: true,
                cpf: data.person_type === 'PF' ? data.cpf?.replace(/\D/g, '') : null,
                cnpj: data.person_type === 'PJ' ? data.cnpj?.replace(/\D/g, '') : null,
                technical_manager_cpf: data.person_type === 'PJ' ? data.technical_manager_cpf?.replace(/\D/g, '') : null,
            };

            const response = await publicApi.post('/api/professionals/', payload);
            const professionalId = response.data.id;

            const fileUploads = Array.from(files).map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('professional', professionalId);
                formData.append('description', 'Documento de Habilitação');
                return publicApi.post('/api/documents/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            });

            await Promise.all(fileUploads);

            alert("Cadastro realizado com sucesso! Verifique seu e-mail.");
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.response?.data) {
                const data = err.response.data;
                if (data.cpf) setGeneralError(Array.isArray(data.cpf) ? data.cpf[0] : data.cpf);
                else if (data.cnpj) setGeneralError(Array.isArray(data.cnpj) ? data.cnpj[0] : data.cnpj);
                else setGeneralError("Erro ao enviar cadastro. Verifique os dados.");
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
                        Selecione o tipo de inscrição e preencha os dados
                    </Typography>
                </Box>

                {generalError && (
                    <Alert severity="error" sx={{ mb: 3 }} icon={<AlertCircle />}>
                        {generalError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>

                    <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Tipo de Cadastro</FormLabel>
                            <Controller
                                rules={{ required: true }}
                                control={control}
                                name="person_type"
                                render={({ field }) => (
                                    <RadioGroup {...field} row>
                                        <FormControlLabel value="PF" control={<Radio />} label="Pessoa Física (Profissional Liberal)" />
                                        <FormControlLabel value="PJ" control={<Radio />} label="Pessoa Jurídica (Clínica/Empresa)" />
                                    </RadioGroup>
                                )}
                            />
                        </FormControl>
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                        Dados {personType === 'PJ' ? 'da Empresa' : 'Pessoais'}
                    </Typography>

                    <Grid container spacing={2}>
                        {personType === 'PF' && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <TextField fullWidth label="Nome Completo" placeholder="Ex: Dr. João Silva" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="CPF" placeholder="000.000.000-00" inputProps={{ maxLength: 14 }} {...register('cpf')} error={!!errors.cpf} helperText={errors.cpf?.message} />
                                </Grid>
                            </>
                        )}

                        {personType === 'PJ' && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <TextField fullWidth label="Razão Social" placeholder="Ex: Clinica Medica LTDA" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Nome Fantasia" placeholder="Ex: Vida Saudável" {...register('company_name')} error={!!errors.company_name} helperText={errors.company_name?.message} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="CNPJ"
                                        placeholder="00.000.000/0000-00"
                                        inputProps={{ maxLength: 18 }}
                                        {...register('cnpj')}
                                        error={!!errors.cnpj || (cnpjStatus?.valid === false)}
                                        helperText={errors.cnpj?.message || (cnpjStatus?.valid === false ? cnpjStatus.message : null)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={validateCNPJ} disabled={isValidatingCnpj || !cnpjValue} color={cnpjStatus?.valid ? 'success' : 'default'}>
                                                        {isValidatingCnpj ? <CircularProgress size={20} /> : (cnpjStatus?.valid ? <CheckCircle color="green" /> : <Search />)}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    {cnpjStatus?.valid && (
                                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            <Check size={14} /> {cnpjStatus.message}
                                        </Typography>
                                    )}
                                    {cnpjStatus?.valid === false && (
                                        <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            <AlertTriangle size={14} /> {cnpjStatus.message}
                                        </Typography>
                                    )}
                                </Grid>
                            </>
                        )}

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label={personType === 'PJ' ? "Email Institucional" : "E-mail Profissional"} type="email" placeholder="email@exemplo.com" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Telefone/Celular" placeholder="(00) 00000-0000" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
                        </Grid>

                        {personType === 'PJ' && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 'bold' }}>Responsável Técnico</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <TextField fullWidth label="Nome do Responsável Técnico" {...register('technical_manager_name')} error={!!errors.technical_manager_name} helperText={errors.technical_manager_name?.message} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth label="CPF do Responsável" {...register('technical_manager_cpf')} error={!!errors.technical_manager_cpf} helperText={errors.technical_manager_cpf?.message} />
                                </Grid>
                            </>
                        )}

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth type="date" label={personType === 'PJ' ? "Data de Abertura" : "Data de Nascimento"} InputLabelProps={{ shrink: true }} {...register('birth_date')} error={!!errors.birth_date} helperText={errors.birth_date?.message} />
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
                        disabled={isLoading || !personType}
                        sx={{ mt: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Solicitação'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};
