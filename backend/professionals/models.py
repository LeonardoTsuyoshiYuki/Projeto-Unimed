import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from datetime import timedelta, date
from django.utils import timezone

def document_upload_path(instance, filename):
    cpf = 'unknown'
    try:
        cpf = instance.professional.cpf
    except Exception:
        if hasattr(instance, 'professional_id') and instance.professional_id:
            # Lazy import to avoid circular dependency/definition issues
            from .models import Professional
            try:
                prof = Professional.objects.get(id=instance.professional_id)
                cpf = prof.cpf
            except Professional.DoesNotExist:
                pass
    return f'documents/{cpf}/{filename}'

def validate_file_size(value):
    limit = 5 * 1024 * 1024 # 5 MB
    if value.size > limit:
        raise ValidationError('Arquivo muito grande. O tamanho máximo é 5MB.')

class Professional(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('APPROVED', 'Aprovado'),
        ('REJECTED', 'Reprovado'),
        ('ADJUSTMENT_REQUESTED', 'Ajuste Solicitado'),
    ]

    PERSON_TYPE_CHOICES = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person_type = models.CharField(max_length=2, choices=PERSON_TYPE_CHOICES, default='PF')
    name = models.CharField(max_length=255) # Razão Social if PJ
    
    # Conditional Identifiers
    cpf = models.CharField(max_length=11, db_index=True, null=True, blank=True)
    cnpj = models.CharField(max_length=14, db_index=True, null=True, blank=True)
    
    # PJ-specific fields
    company_name = models.CharField(max_length=255, null=True, blank=True) # Nome Fantasia
    technical_manager_name = models.CharField(max_length=255, null=True, blank=True)
    technical_manager_cpf = models.CharField(max_length=11, null=True, blank=True)

    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    # Personal Data
    birth_date = models.DateField()
    
    # Address Data
    zip_code = models.CharField(max_length=9) # CEP
    street = models.CharField(max_length=255) # Logradouro
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=255, null=True, blank=True)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2) # UF

    # Professional Data
    EDUCATION_CHOICES = [
        ('Agente Comunitário de Saúde', 'Agente Comunitário de Saúde'),
        ('Agente de Combate às Endemias', 'Agente de Combate às Endemias'),
        ('Acompanhante Terapêutico', 'Acompanhante Terapêutico'),
        ('Administrador Hospitalar', 'Administrador Hospitalar'),
        ('Analista de Regulação em Saúde', 'Analista de Regulação em Saúde'),
        ('Antropólogo da Saúde', 'Antropólogo da Saúde'),
        ('Aromaterapeuta', 'Aromaterapeuta'),
        ('Arteterapeuta', 'Arteterapeuta'),
        ('Assistente Social (na saúde)', 'Assistente Social (na saúde)'),
        ('Audiologista', 'Audiologista'),
        ('Auxiliar de Enfermagem', 'Auxiliar de Enfermagem'),
        ('Auxiliar de Farmácia', 'Auxiliar de Farmácia'),
        ('Auxiliar de Saúde Bucal', 'Auxiliar de Saúde Bucal'),
        ('Bioquímico', 'Bioquímico'),
        ('Biomédico', 'Biomédico'),
        ('Biólogo (atuando na saúde)', 'Biólogo (atuando na saúde)'),
        ('Citotécnico', 'Citotécnico'),
        ('Cosmetólogo', 'Cosmetólogo'),
        ('Cuidador de Idosos', 'Cuidador de Idosos'),
        ('Dentista (Cirurgião-Dentista)', 'Dentista (Cirurgião-Dentista)'),
        ('Dosimetrista', 'Dosimetrista'),
        ('Doula', 'Doula'),
        ('Educador Físico (Bacharel)', 'Educador Físico (Bacharel)'),
        ('Educador em Saúde', 'Educador em Saúde'),
        ('Enfermeiro', 'Enfermeiro'),
        ('Engenheiro Biomédico', 'Engenheiro Biomédico'),
        ('Epidemiologista', 'Epidemiologista'),
        ('Esteticista', 'Esteticista'),
        ('Farmacêutico', 'Farmacêutico'),
        ('Farmacêutico Clínico', 'Farmacêutico Clínico'),
        ('Farmacêutico Hospitalar', 'Farmacêutico Hospitalar'),
        ('Farmacêutico Industrial', 'Farmacêutico Industrial'),
        ('Fisioterapeuta', 'Fisioterapeuta'),
        ('Fonoaudiólogo', 'Fonoaudiólogo'),
        ('Gerontólogo', 'Gerontólogo'),
        ('Gestor Hospitalar', 'Gestor Hospitalar'),
        ('Gestor em Saúde', 'Gestor em Saúde'),
        ('Histotécnico', 'Histotécnico'),
        ('Massoterapeuta', 'Massoterapeuta'),
        ('Musicoterapeuta', 'Musicoterapeuta'),
        ('Naturopata', 'Naturopata'),
        ('Nutricionista', 'Nutricionista'),
        ('Obstetriz', 'Obstetriz'),
        ('Optometrista', 'Optometrista'),
        ('Óptico', 'Óptico'),
        ('Operador de Raios-X', 'Operador de Raios-X'),
        ('Ortesista e Protesista', 'Ortesista e Protesista'),
        ('Osteopata', 'Osteopata'),
        ('Parteira Tradicional', 'Parteira Tradicional'),
        ('Patologista Clínico (não médico)', 'Patologista Clínico (não médico)'),
        ('Podólogo', 'Podólogo'),
        ('Protético Dentário', 'Protético Dentário'),
        ('Psicanalista', 'Psicanalista'),
        ('Psicólogo', 'Psicólogo'),
        ('Quiropraxista', 'Quiropraxista'),
        ('Radiologista Tecnólogo', 'Radiologista Tecnólogo'),
        ('Reflexoterapeuta', 'Reflexoterapeuta'),
        ('Sanitarista', 'Sanitarista'),
        ('Sociólogo da Saúde', 'Sociólogo da Saúde'),
        ('Técnico em Administração Hospitalar', 'Técnico em Administração Hospitalar'),
        ('Técnico em Análises Clínicas', 'Técnico em Análises Clínicas'),
        ('Técnico em Audiometria', 'Técnico em Audiometria'),
        ('Técnico em Banco de Sangue', 'Técnico em Banco de Sangue'),
        ('Técnico em Enfermagem', 'Técnico em Enfermagem'),
        ('Técnico em Equipamentos Biomédicos', 'Técnico em Equipamentos Biomédicos'),
        ('Técnico em Farmácia', 'Técnico em Farmácia'),
        ('Técnico em Gerontologia', 'Técnico em Gerontologia'),
        ('Técnico em Hemoterapia', 'Técnico em Hemoterapia'),
        ('Técnico em Histologia', 'Técnico em Histologia'),
        ('Técnico em Imobilizações Ortopédicas', 'Técnico em Imobilizações Ortopédicas'),
        ('Técnico em Imagenologia', 'Técnico em Imagenologia'),
        ('Técnico em Nutrição e Dietética', 'Técnico em Nutrição e Dietética'),
        ('Técnico em Óptica', 'Técnico em Óptica'),
        ('Técnico em Prótese Dentária', 'Técnico em Prótese Dentária'),
        ('Técnico em Radiologia', 'Técnico em Radiologia'),
        ('Técnico em Registros e Informações em Saúde', 'Técnico em Registros e Informações em Saúde'),
        ('Técnico em Saúde Bucal', 'Técnico em Saúde Bucal'),
        ('Técnico em Saúde Pública', 'Técnico em Saúde Pública'),
        ('Técnico em Vigilância em Saúde', 'Técnico em Vigilância em Saúde'),
        ('Tecnólogo em Análises Clínicas', 'Tecnólogo em Análises Clínicas'),
        ('Tecnólogo em Estética e Cosmética', 'Tecnólogo em Estética e Cosmética'),
        ('Tecnólogo em Oftálmica', 'Tecnólogo em Oftálmica'),
        ('Tecnólogo em Radiologia', 'Tecnólogo em Radiologia'),
        ('Tecnólogo em Saúde Pública', 'Tecnólogo em Saúde Pública'),
        ('Tecnólogo em Sistemas Biomédicos', 'Tecnólogo em Sistemas Biomédicos'),
        ('Terapeuta Cognitivo-Comportamental', 'Terapeuta Cognitivo-Comportamental'),
        ('Terapeuta Familiar', 'Terapeuta Familiar'),
        ('Terapeuta Holístico', 'Terapeuta Holístico'),
        ('Terapeuta Integrativo', 'Terapeuta Integrativo'),
        ('Terapeuta Ocupacional', 'Terapeuta Ocupacional'),
    ]

    education = models.CharField(max_length=255) # Formação Acadêmica - Choices removed to allow custom input
    institution = models.CharField(max_length=255) # Instituição de Ensino
    graduation_year = models.IntegerField() # Ano de Conclusão
    council_name = models.CharField(max_length=50) # ex: CRM, COREN
    council_number = models.CharField(max_length=50)
    area_of_action = models.CharField(max_length=255, null=True, blank=True) # Área de Atuação (Optional)
    # specialty removed
    experience_years = models.IntegerField() # Tempo de Experiência
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    submission_date = models.DateTimeField(auto_now_add=True)
    last_status_update = models.DateTimeField(auto_now=True)
    
    # LGPD
    consent_given = models.BooleanField(default=False)
    consent_date = models.DateTimeField(null=True, blank=True)

    # Audit
    approved_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_professionals')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='rejected_professionals')
    rejected_at = models.DateTimeField(null=True, blank=True)
    
    # Internal Notes (Admin only)
    internal_notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-submission_date']

    def __str__(self):
        return f"{self.name} ({self.status})"

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    professional = models.ForeignKey(Professional, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(
        upload_to=document_upload_path,
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png']),
            validate_file_size
        ]
    )
    description = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} - {self.professional.name}"
