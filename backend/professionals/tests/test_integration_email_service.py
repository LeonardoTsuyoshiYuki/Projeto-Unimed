import pytest
import datetime
from unittest.mock import patch, MagicMock
from professionals.models import Professional
from professionals.services import send_confirmation_email
from core.services.email.interfaces import EmailResult
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestEmailIntegration:
    @pytest.fixture
    def professional(self):
        return Professional.objects.create(
            name="Test Professional",
            email="integration@test.com",
            phone="123456789",
            education="Cardiologia",
            council_number="CRM-123456",
            council_name="CRM",
            birth_date=datetime.date(1990, 1, 1),
            zip_code="12345000",
            street="Rua Teste",
            number="100",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            institution="USP",
            graduation_year=2015,
            experience_years=5,
            consent_given=True
        )

    @patch('professionals.services.get_email_service')
    def test_send_confirmation_email_content(self, mock_get_service, professional):
        # Setup Mock Service
        mock_service_instance = MagicMock()
        mock_service_instance.send.return_value = EmailResult(
            success=True, 
            provider="mock", 
            status="sent", 
            message_id="mock-id"
        )
        mock_get_service.return_value = mock_service_instance
        
        # Execute
        sent = send_confirmation_email(professional)
        
        # Verify
        assert sent is True
        mock_service_instance.send.assert_called_once()
        call_args = mock_service_instance.send.call_args[1]
        assert call_args['to'] == professional.email
        assert call_args['subject'] == "Confirmação de Recebimento de Cadastro – Unimed"
        assert "Recebemos seu interesse em se credenciar" in call_args['content']
        assert "Pessoa Física" in call_args['content']
        assert "CPF: 123.***.***" in call_args['html_content']

    @patch('professionals.services.get_email_service')
    def test_integration_viewset_sends_email(self, mock_get_service):
        client = APIClient()
        
        # Setup Mock
        mock_service_instance = MagicMock()
        mock_service_instance.send.return_value = EmailResult(
            success=True, 
            provider="mock", 
            status="sent", 
            message_id="mock-id"
        )
        mock_get_service.return_value = mock_service_instance

        data = {
            "name": "Integration Doc",
            "email": "integration@test.com",
            "cpf": "12345678901",
            "phone": "999999999",
            "education": "Ortopedia",
            "council_name": "CRM",
            "council_number": "CRM-99999",
            "institution": "UNIFESP",
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
        
        if response.status_code != 201:
            print(response.data) # Debug if fails
            
        assert response.status_code == 201
        mock_service_instance.send.assert_called_once()
        assert mock_service_instance.send.call_args[1]['to'] == "integration@test.com"
