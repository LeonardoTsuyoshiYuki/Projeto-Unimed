import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone

def document_upload_path(instance, filename):
    return f'documents/{instance.professional.cpf}/{filename}'

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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    cpf = models.CharField(max_length=11, unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    submission_date = models.DateTimeField(auto_now_add=True)
    last_status_update = models.DateTimeField(auto_now=True)
    
    # LGPD
    consent_given = models.BooleanField(default=False)
    consent_date = models.DateTimeField(null=True, blank=True)
    
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
