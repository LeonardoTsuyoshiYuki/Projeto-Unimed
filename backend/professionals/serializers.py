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
            'status', 'submission_date', 'documents',
            'consent_given', 'consent_date'
        ]
        read_only_fields = ['status', 'submission_date', 'consent_date']

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
