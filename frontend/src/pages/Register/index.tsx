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
    InputAdornment,
    IconButton,
    Grid,
    Stack
} from '@mui/material';
import { Upload, CheckCircle, AlertCircle, Search, Trash2 } from 'lucide-react';
import { publicApi } from '../../services/api';
import { EDUCATION_OPTIONS } from '../../constants/education';

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

    const [files, setFiles] = useState<File[]>([]); // Changed to Array for easier management
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const [cnpjStatus, setCnpjStatus] = useState<{ valid: boolean, message: string, status: string } | null>(null);
    const [isValidatingCnpj, setIsValidatingCnpj] = useState(false);
    const navigate = useNavigate();

    const selectedEducation = watch('education');
    const cnpjValue = watch('cnpj');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Convert to array and append
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
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
                setValue('street', response.data.logradouro, { shouldValidate: true });
                setValue('neighborhood', response.data.bairro, { shouldValidate: true });
                setValue('city', response.data.localidade, { shouldValidate: true });
                setValue('state', response.data.uf, { shouldValidate: true });
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
        if (files.length === 0) {
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

            const fileUploads = files.map(file => {
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
                        Credenciamento Unimed
                    </Typography>
                    <Typography color="text.secondary">
                        Preencha os dados abaixo para iniciar seu credenciamento
                    </Typography>
                </Box>

                {generalError && (
                    <Alert severity="error" sx={{ mb: 3 }} icon={<AlertCircle />}>
                        {generalError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>

                    <Stack spacing={4}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Tipo de Profissional
                            </Typography>
                            <FormControl component="fieldset" fullWidth>
                                <Controller
                                    rules={{ required: true }}
                                    control={control}
                                    name="person_type"
                                    render={({ field }) => (
                                        <RadioGroup {...field} row>
                                            <FormControlLabel
                                                value="PF"
                                                control={<Radio />}
                                                label="Pessoa Física"
                                                sx={{ mr: 4 }}
                                            />
                                            <FormControlLabel
                                                value="PJ"
                                                control={<Radio />}
                                                label="Pessoa Jurídica"
                                            />
                                        </RadioGroup>
                                    )}
                                />
                            </FormControl>
                        </Paper>

                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                Dados {personType === 'PJ' ? 'da Empresa' : 'Pessoais'}
                            </Typography>

                            <Grid container spacing={2} sx={{ mt: 1 }}>
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
                                                            <IconButton onClick={validateCNPJ} disabled={isValidatingCnpj || !cnpjValue} color={cnpjStatus?.valid ? 'success' : 'default'} edge="end">
                                                                {isValidatingCnpj ? <CircularProgress size={20} /> : (cnpjStatus?.valid ? <CheckCircle color="green" /> : <Search />)}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
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
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label={personType === 'PJ' ? "Data de Abertura" : "Data de Nascimento"}
                                        InputLabelProps={{ shrink: true }}
                                        {...register('birth_date')}
                                        error={!!errors.birth_date}
                                        helperText={errors.birth_date?.message}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                Endereço
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 12, sm: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="CEP"
                                        placeholder="00000000"
                                        inputProps={{ maxLength: 9 }}
                                        {...register('zip_code')}
                                        onBlur={handleCepBlur}
                                        error={!!errors.zip_code}
                                        helperText={errors.zip_code?.message}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <TextField
                                        fullWidth
                                        label="Cidade"
                                        {...register('city')}
                                        error={!!errors.city}
                                        helperText={errors.city?.message}
                                        InputProps={{ readOnly: true }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="UF"
                                        {...register('state')}
                                        error={!!errors.state}
                                        helperText={errors.state?.message}
                                        InputProps={{ readOnly: true }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 9 }}>
                                    <TextField
                                        fullWidth
                                        label="Logradouro"
                                        {...register('street')}
                                        error={!!errors.street}
                                        helperText={errors.street?.message}
                                        InputProps={{ readOnly: true }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="Número"
                                        {...register('number')}
                                        error={!!errors.number}
                                        helperText={errors.number?.message}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Bairro"
                                        {...register('neighborhood')}
                                        error={!!errors.neighborhood}
                                        helperText={errors.neighborhood?.message}
                                        InputProps={{ readOnly: true }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Complemento"
                                        {...register('complement')}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                Dados Profissionais
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Formação Acadêmica"
                                        defaultValue=""
                                        {...register('education')}
                                        error={!!errors.education}
                                        helperText={errors.education?.message}
                                        InputLabelProps={{ shrink: true }}
                                    >
                                        {EDUCATION_OPTIONS.map((option) => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                {selectedEducation === 'Outros' && (
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Qual sua formação?"
                                            placeholder="Digite sua formação"
                                            {...register('custom_education')}
                                            error={!!errors.custom_education}
                                            helperText={errors.custom_education?.message}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <TextField fullWidth label="Instituição de Ensino" placeholder="Ex: USP" {...register('institution')} error={!!errors.institution} helperText={errors.institution?.message} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField fullWidth label="Ano Conclusão" placeholder="2020" inputProps={{ maxLength: 4 }} {...register('graduation_year')} error={!!errors.graduation_year} helperText={errors.graduation_year?.message} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Conselho de Classe" placeholder="Ex: CRM-SP" {...register('council_name')} error={!!errors.council_name} helperText={errors.council_name?.message} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Número Inscrição" placeholder="123456" {...register('council_number')} error={!!errors.council_number} helperText={errors.council_number?.message} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Tempo de Experiência (anos)" type="number" placeholder="Ex: 5" {...register('experience_years')} error={!!errors.experience_years} helperText={errors.experience_years?.message} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField fullWidth label="Área de Atuação (Opcional)" placeholder="Ex: Cardiologia" {...register('area_of_action')} InputLabelProps={{ shrink: true }} />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                Documentação
                            </Typography>

                            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', backgroundColor: 'grey.50' }}>
                                <Button
                                    variant="contained"
                                    component="label"
                                    startIcon={<Upload />}
                                    size="large"
                                    sx={{ mb: 2 }}
                                >
                                    Selecionar Arquivos
                                    <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileChange} />
                                </Button>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    Formatos: PDF, JPG, PNG (Max 5MB)
                                </Typography>

                                {files.length > 0 && (
                                    <Stack spacing={1} sx={{ mt: 3, alignItems: 'center' }}>
                                        {files.map((file, idx) => (
                                            <Paper key={idx} elevation={1} sx={{ p: 1, px: 2, display: 'flex', alignItems: 'center', gap: 2, width: 'fit-content' }}>
                                                <CheckCircle size={16} color="green" />
                                                <Typography variant="body2">{file.name}</Typography>
                                                <IconButton size="small" onClick={() => removeFile(idx)} color="error">
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </Paper>
                                        ))}
                                    </Stack>
                                )}
                            </Paper>
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
                            sx={{ py: 2, fontSize: '1.1rem', fontWeight: 'bold', boxShadow: 3 }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Inscrição'}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
};
