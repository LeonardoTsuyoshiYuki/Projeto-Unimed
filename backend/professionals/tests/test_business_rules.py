import pytest
import uuid
from datetime import timedelta
from django.utils import timezone
from professionals.models import Professional
from professionals.serializers import ProfessionalSerializer

@pytest.mark.django_db
class TestBusinessRules:
    
    def test_default_status_is_pending(self):
        """Rule 1: New professional registration must have default status PENDING"""
        prof = Professional.objects.create(
            name="Test User",
            cpf="12345678901",
            email="test@example.com",
            phone="11999999999",
            consent_given=True
        )
        assert prof.status == 'PENDING'

    def test_required_fields_enforced(self):
        """Rule 3: Validation - Required fields must be enforced"""
        serializer = ProfessionalSerializer(data={})
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
        assert 'cpf' in serializer.errors
        assert 'email' in serializer.errors
        assert 'consent_given' in serializer.errors # Consent is required by logic if not enforced by model default

    def test_block_registration_within_90_days(self):
        """Rule 2a: Block new registration within 90 days"""
        # Create a recent registration
        Professional.objects.create(
            id=uuid.uuid4(), # Ensure unique ID
            name="Recent User",
            cpf="11111111111", 
            email="recent@test.com",
            phone="11999999999",
            consent_given=True,
            submission_date=timezone.now()
        )
        
        # Try to register again with same CPF
        data = {
            "name": "New Attempt",
            "cpf": "11111111111",
            "email": "new@test.com",
            "phone": "11888888888",
            "consent_given": True
        }
        serializer = ProfessionalSerializer(data=data)
        assert not serializer.is_valid()
        assert "90 dias" in str(serializer.errors['cpf'][0])

    def test_allow_registration_after_90_days(self):
        """Rule 2b: Allow registration after 90 days"""
        # Create an old registration (91 days ago)
        old_date = timezone.now() - timedelta(days=91)
        
        # We need to hack the creation because auto_now_add forces now() on create.
        # So we create then update.
        prof = Professional.objects.create(
            id=uuid.uuid4(),
            name="Old User",
            cpf="22222222222",
            email="old@test.com",
            phone="11999999999",
            consent_given=True
        )
        # Manually update submission_date to the past
        # Note: Update uses current time for auto_now fields usually, 
        # but submission_date is auto_now_add, so it shouldn't change on update,
        # but we need to force it.
        # Direct update on queryset avoids save() signals if any, but safer here:
        Professional.objects.filter(id=prof.id).update(submission_date=old_date)
        
        # Try to register again with same CPF
        data = {
            "name": "Retry User",
            "cpf": "22222222222",
            "email": "retry@test.com",
            "phone": "11777777777",
            "consent_given": True
        }
        serializer = ProfessionalSerializer(data=data)
        
        # Validation should pass
        assert serializer.is_valid(), f"Errors: {serializer.errors}"
        
        # Save should pass (Create new record)
        # This is where we expect failure if unique=True is set on CPF
        try:
            serializer.save()
        except Exception as e:
            pytest.fail(f"Could not save new registration after 90 days: {e}")
