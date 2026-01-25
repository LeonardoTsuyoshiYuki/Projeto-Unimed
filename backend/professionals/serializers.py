from rest_framework import serializers
from .models import Professional, Document
from django.utils import timezone
from datetime import timedelta

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'file', 'description', 'uploaded_at']

class ProfessionalSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Professional
        fields = [
            'id', 'name', 'cpf', 'email', 'phone',
            'birth_date', 'address', 'education', 'institution',
            'graduation_year', 'council_name', 'council_number',
            'specialty', 'experience_years', 'area_of_action',
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


    def validate_cpf(self, value):
        # Check 90 days rule
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
        return super().create(validated_data)

class ProfessionalManagementSerializer(ProfessionalSerializer):
    class Meta(ProfessionalSerializer.Meta):
        # Remove 'status' from read_only_fields to allow Admin updates
        read_only_fields = ['submission_date', 'consent_date']
