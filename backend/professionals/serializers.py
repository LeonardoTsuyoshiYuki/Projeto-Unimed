from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Professional, Document

class DocumentSerializer(serializers.ModelSerializer):
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = ['id', 'professional', 'file', 'description', 'uploaded_at', 'file_size']
        read_only_fields = ['id', 'uploaded_at', 'file_size']

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except Exception:
            return 0

class ProfessionalSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    
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
            'cpf': {'validators': []} # Disable default validators if any linger, though model change should suffice. 
                                      # Actually DRF might still infer unique if model had it, but we changed model. 
                                      # However, we should be explicit given the transition.
        }

    def validate_consent_given(self, value):
        if value is not True:
            raise serializers.ValidationError("O consentimento é obrigatório.")
        return value


    def validate(self, data):
        person_type = data.get('person_type', 'PF')
        
        if person_type == 'PF':
            if not data.get('cpf'):
                raise serializers.ValidationError({"cpf": "CPF é obrigatório para Pessoa Física."})
            if data.get('cnpj'):
                 raise serializers.ValidationError({"cnpj": "CNPJ não deve ser preenchido para Pessoa Física."})
        
        elif person_type == 'PJ':
            if not data.get('cnpj'):
                raise serializers.ValidationError({"cnpj": "CNPJ é obrigatório para Pessoa Jurídica."})
            if data.get('cpf'):
                 raise serializers.ValidationError({"cpf": "CPF não deve ser preenchido para Pessoa Jurídica (use o do Responsável Técnico)."})
            
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
