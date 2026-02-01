from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator
from .models import Professional, Document

class DocumentSerializer(serializers.ModelSerializer):
    file_size = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'professional', 'file', 'description', 'uploaded_at', 'file_size', 'download_url']
        read_only_fields = ['id', 'uploaded_at', 'file_size', 'download_url']

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except Exception:
            return 0

    def get_download_url(self, obj):
        from rest_framework.reverse import reverse
        request = self.context.get('request')
        if request is None:
            return None
        return reverse('document-download', kwargs={'pk': obj.pk}, request=request)

class ProfessionalSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    graduation_year = serializers.IntegerField(
        validators=[MinValueValidator(1950), MaxValueValidator(2100)],
        error_messages={'min_value': 'Ano inválido.', 'max_value': 'Ano inválido.'}
    )
    experience_years = serializers.IntegerField(min_value=0)
    
    class Meta:
        model = Professional
        fields = [
            'id', 'person_type', 'name', 'cpf', 'cnpj', 
            'company_name', 'technical_manager_name', 'technical_manager_cpf',
            'email', 'phone',
            'birth_date', 'zip_code', 'street', 'number', 'complement', 'neighborhood', 'city', 'state',
            'education', 'institution', 'graduation_year', 
            'council_name', 'council_number', 'experience_years', 'area_of_action',
            'status', 'submission_date', 'documents',
            'consent_given', 'consent_date'
        ]
        read_only_fields = ['status', 'submission_date', 'consent_date']
        extra_kwargs = {
            'consent_given': {'required': True, 'allow_null': False},
            'cpf': {'validators': []},
            'zip_code': {'min_length': 8, 'max_length': 9},
            'phone': {'min_length': 10},
            'state': {'min_length': 2, 'max_length': 2}
        }

    def validate_consent_given(self, value):
        if value is not True:
            raise serializers.ValidationError("O consentimento é obrigatório.")
        return value


    def validate(self, data):
        # Handle Partial Updates: Merge data with instance if available
        if self.instance:
            person_type = data.get('person_type', self.instance.person_type)
            cpf = data.get('cpf', self.instance.cpf)
            cnpj = data.get('cnpj', self.instance.cnpj)
        else:
            person_type = data.get('person_type', 'PF')
            cpf = data.get('cpf')
            cnpj = data.get('cnpj')
        
        if person_type == 'PF':
            if not cpf:
                raise serializers.ValidationError({"cpf": "CPF é obrigatório para Pessoa Física."})
            if cnpj:
                 raise serializers.ValidationError({"cnpj": "CNPJ não deve ser preenchido para Pessoa Física."})
        
        if person_type == 'PJ':
            if not cnpj:
                raise serializers.ValidationError({"cnpj": "CNPJ é obrigatório para Pessoa Jurídica."})
            if cpf:
                 raise serializers.ValidationError({"cpf": "CPF não deve ser preenchido para Pessoa Jurídica (use o do Responsável Técnico)."})
            
            # External CNPJ Integration
            should_validate_cnpj = True
            if self.instance and self.instance.cnpj == cnpj and 'cnpj' not in data:
                 should_validate_cnpj = False
            
            if should_validate_cnpj:
                from core.services.cnpj.service import CNPJService
                cnpj_service = CNPJService()
                result = cnpj_service.validate_cnpj(cnpj)
                
                if not result.valid:
                     raise serializers.ValidationError({"cnpj": result.message})
            
        return data

    def validate_cpf(self, value):
        if not value:
            return value
        # Check 90 days rule for CPF (PF only)
        ninety_days_ago = timezone.now() - timedelta(days=90)
        recent_submission = Professional.objects.filter(
            cpf=value, 
            submission_date__gte=ninety_days_ago
        ).exists()
        
        if recent_submission:
            raise serializers.ValidationError("Já existe uma solicitação para este CPF nos últimos 90 dias.")
        return value

    def create(self, validated_data):
        if validated_data.get('consent_given'):
            validated_data['consent_date'] = timezone.now()
        
        # Enforce Nulled fields based on Type to keep DB clean
        if validated_data.get('person_type') == 'PF':
            validated_data['cnpj'] = None
            validated_data['company_name'] = None
            validated_data['technical_manager_name'] = None
            validated_data['technical_manager_cpf'] = None
        elif validated_data.get('person_type') == 'PJ':
            validated_data['cpf'] = None

        return super().create(validated_data)

class ProfessionalManagementSerializer(ProfessionalSerializer):
    class Meta(ProfessionalSerializer.Meta):
        # Remove 'status' from read_only_fields to allow Admin updates
        read_only_fields = ['submission_date', 'consent_date']
        fields = ProfessionalSerializer.Meta.fields + ['internal_notes']
