import pytest
import datetime
from unittest.mock import patch, MagicMock
from django.conf import settings
from professionals.models import Professional
from professionals.services import send_confirmation_email
from core.services.email.factory import get_email_service
from core.services.email.providers.console import ConsoleEmailProvider
from core.services.email.providers.django import DjangoEmailProvider
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestEmailHardening:
    
    @pytest.fixture
    def professional_pf(self):
        return Professional.objects.create(
            name="PF Test",
            email="pf@test.com",
            phone="123456789",
            education="Cardiologia",
            council_number="123",
            council_name="CRM",
            birth_date=datetime.date(1990, 1, 1),
            zip_code="12345678",
            street="Rua test",
            number="1",
            neighborhood="Bairro",
            city="Cidade",
            state="SP",
            institution="Inst",
            graduation_year=2010,
            experience_years=10,
            person_type='PF',
            cpf='12345678901'
        )

    @pytest.fixture
    def professional_pj(self):
        return Professional.objects.create(
            name="Razao Social PJ",
            email="pj@test.com",
            phone="123456789",
            education="Cardiologia",
            council_number="123",
            council_name="CRM",
            birth_date=datetime.date(1990, 1, 1),
            zip_code="12345678",
            street="Rua test",
            number="1",
            neighborhood="Bairro",
            city="Cidade",
            state="SP",
            institution="Inst",
            graduation_year=2010,
            experience_years=10,
            person_type='PJ',
            cnpj='12345678000199'
        )

    def test_console_provider_fallback_in_dev(self):
        with patch.object(settings, 'EMAIL_MODE', 'dev'):
            with patch.object(settings, 'EMAIL_PROVIDER', 'console'):
                service = get_email_service()
                assert isinstance(service.provider, ConsoleEmailProvider)
                result = service.send("test", "to@test.com", "content")
                assert result.success is True
                assert result.provider == "console"

    def test_django_provider_in_prod(self):
        with patch.object(settings, 'EMAIL_MODE', 'prod'):
            with patch.object(settings, 'EMAIL_PROVIDER', 'django'):
                with patch.object(settings, 'EMAIL_HOST_PASSWORD', 'secret'):
                    service = get_email_service()
                    assert isinstance(service.provider, DjangoEmailProvider)

    def test_fallback_to_console_if_prod_missing_pass(self):
        with patch.object(settings, 'EMAIL_MODE', 'prod'):
            with patch.object(settings, 'EMAIL_PROVIDER', 'django'):
                with patch.object(settings, 'EMAIL_HOST_PASSWORD', None):
                    service = get_email_service()
                    assert isinstance(service.provider, ConsoleEmailProvider)

    @patch('professionals.services.get_email_service')
    def test_pf_email_content_masking(self, mock_get_service, professional_pf):
        mock_service = MagicMock()
        mock_get_service.return_value = mock_service
        
        send_confirmation_email(professional_pf)
        
        args, kwargs = mock_service.send.call_args
        assert "Pessoa Física" in kwargs['content']
        assert "CPF: 123.***.***" in kwargs['html_content']
        assert "12345678901" not in kwargs['content']

    @patch('professionals.services.get_email_service')
    def test_pj_email_content_masking(self, mock_get_service, professional_pj):
        mock_service = MagicMock()
        mock_get_service.return_value = mock_service
        
        send_confirmation_email(professional_pj)
        
        args, kwargs = mock_service.send.call_args
        assert "Pessoa Jurídica" in kwargs['content']
        assert "CNPJ: 12.***.***" in kwargs['html_content']
        assert "12345678000199" not in kwargs['content']

    @patch('professionals.services.get_email_service')
    @patch('django.db.transaction.on_commit')
    def test_registration_calls_on_commit(self, mock_on_commit, mock_get_service):
        client = APIClient()
        data = {
            "name": "Test On Commit",
            "email": "test@oncommit.com",
            "cpf": "11122233344",
            "phone": "999999999",
            "education": "Ortopedia",
            "council_name": "CRM",
            "council_number": "123",
            "institution": "UFRJ",
            "graduation_year": 2020,
            "experience_years": 2,
            "birth_date": "1990-01-01",
            "zip_code": "01001000",
            "street": "Praça da Sé",
            "number": "1",
            "neighborhood": "Sé",
            "city": "São Paulo",
            "state": "SP",
            "consent_given": True
        }
        
        response = client.post('/api/professionals/', data)
        assert response.status_code == 201
        
        # Verify on_commit was called
        assert mock_on_commit.called

    @patch('professionals.services.get_email_service')
    def test_registration_continues_if_email_fails(self, mock_get_service):
        mock_service = MagicMock()
        # Simulate an exception in the provider
        mock_service.send.side_effect = Exception("SMTP Timeout")
        mock_get_service.return_value = mock_service
        
        client = APIClient()
        data = {
            "name": "Test Fail",
            "email": "fail@test.com",
            "cpf": "99988877766",
            "phone": "999999999",
            "education": "Ortopedia",
            "council_name": "CRM",
            "council_number": "123",
            "institution": "UFRJ",
            "graduation_year": 2020,
            "experience_years": 2,
            "birth_date": "1990-01-01",
            "zip_code": "01001000",
            "street": "Praça da Sé",
            "number": "1",
            "neighborhood": "Sé",
            "city": "São Paulo",
            "state": "SP",
            "consent_given": True
        }
        
        # In the real flow, transaction.on_commit happens after response.
        # But we can test the service directly or the view helper.
        from professionals.views import ProfessionalViewSet
        view = ProfessionalViewSet()
        
        # This shouldn't raise exception
        prof = Professional.objects.create(**data)
        view._safe_send_email(prof) 
        
        # If it reached here without crashing, it works.
        assert Professional.objects.filter(email="fail@test.com").exists()
