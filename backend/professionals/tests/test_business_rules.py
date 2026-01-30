import pytest
import uuid
from datetime import timedelta, date
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
            birth_date=date(1990, 1, 1),
            zip_code="00000-000",
            street="Rua Teste",
            number="123",
            neighborhood="Bairro",
            city="Cidade",
            state="SP",
            education="Enfermeiro",
            institution="USP",
            graduation_year=2015,
            council_name="COREN",
            council_number="123456",
            experience_years=5,
            consent_given=True
        )
        assert prof.status == 'PENDING'

    def test_required_fields_enforced(self):
        """Rule 3: Validation - Required fields must be enforced"""
        serializer = ProfessionalSerializer(data={})
        assert not serializer.is_valid()
        errors = serializer.errors
        
        required_fields = [
            'name', 'email', 'birth_date', 'zip_code', 'street', 
            'number', 'neighborhood', 'city', 'state',
            'education', 'institution', 'graduation_year', 
            'council_name', 'council_number', 
            'experience_years', 'consent_given'
        ]
        
        for field in required_fields:
            assert field in errors, f"Field {field} should be required"

    def test_block_registration_within_90_days(self):
        """Rule 2a: Block new registration within 90 days"""
        # Create a recent registration
        Professional.objects.create(
            id=uuid.uuid4(),
            name="Recent User",
            cpf="11111111111", 
            email="recent@test.com",
            phone="11999999999",
            birth_date=date(1990, 1, 1),
            zip_code="00000-000",
            street="Rua Teste",
            number="123",
            neighborhood="Bairro",
            city="Cidade",
            state="SP",
            education="Enfermeiro",
            institution="USP",
            graduation_year=2015,
            council_name="COREN",
            council_number="123456",
            experience_years=5,
            consent_given=True,
            submission_date=timezone.now()
        )
        
        # Try to register again with same CPF
        data = {
            "name": "New Attempt",
            "cpf": "11111111111",
            "email": "new@test.com",
            "phone": "11888888888",
            "birth_date": "1990-01-01",
            "zip_code": "00000-000",
            "street": "Rua Nova",
            "number": "456",
            "neighborhood": "Centro",
            "city": "São Paulo",
            "state": "SP",
            "education": "Enfermeiro",
            "institution": "UNIFESP",
            "graduation_year": 2018,
            "council_name": "COREN",
            "council_number": "654321",
            "experience_years": 3,
            "consent_given": True
        }
        serializer = ProfessionalSerializer(data=data)
        assert not serializer.is_valid()
        assert "90 dias" in str(serializer.errors['cpf'][0])

    def test_allow_registration_after_90_days(self):
        """Rule 2b: Allow registration after 90 days"""
        # Create an old registration (91 days ago)
        old_date = timezone.now() - timedelta(days=91)
        
        prof = Professional.objects.create(
            id=uuid.uuid4(),
            name="Old User",
            cpf="22222222222",
            email="old@test.com",
            phone="11999999999",
            birth_date=date(1990, 1, 1),
            zip_code="00000-000",
            street="Rua Teste",
            number="123",
            neighborhood="Bairro",
            city="Cidade",
            state="SP",
            education="Enfermeiro",
            institution="USP",
            graduation_year=2015,
            council_name="COREN",
            council_number="123456",
            experience_years=5,
            consent_given=True
        )
        # Manually update submission_date
        Professional.objects.filter(id=prof.id).update(submission_date=old_date)
        
        # Try to register again with same CPF
        data = {
            "name": "Retry User",
            "cpf": "22222222222",
            "email": "retry@test.com",
            "phone": "11777777777",
            "birth_date": "1990-01-01",
            "zip_code": "00000-000",
            "street": "Rua Nova",
            "number": "456",
            "neighborhood": "Centro",
            "city": "São Paulo",
            "state": "SP",
            "education": "Enfermeiro",
            "institution": "USP",
            "graduation_year": 2015,
            "council_name": "COREN",
            "council_number": "123456",
            "experience_years": 5,
            "consent_given": True
        }
        serializer = ProfessionalSerializer(data=data)
        
        # Validation should pass
        assert serializer.is_valid(), f"Errors: {serializer.errors}"
        
        try:
            serializer.save()
        except Exception as e:
            pytest.fail(f"Could not save new registration after 90 days: {e}")
