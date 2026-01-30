import pytest
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from core.services.cnpj.interfaces import CNPJResult

@pytest.mark.django_db
class TestPFPJValidation:
    def setup_method(self):
        self.client = APIClient()
        # Common data
        self.base_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "11999999999",
            "birth_date": "1990-01-01",
            "zip_code": "12345678",
            "street": "Rua Teste",
            "number": "123",
            "neighborhood": "Bairro",
            "city": "Cidade",
            "state": "SP",
            "education": "Enfermeiro",
            "institution": "USP",
            "graduation_year": 2020,
            "council_name": "COREN",
            "council_number": "123456",
            "experience_years": 5,
            "consent_given": True,
            "documents": [] 
        }

    def test_create_pf_success(self):
        """Should create PF with CPF successfully"""
        data = {
            **self.base_data,
            "person_type": "PF",
            "cpf": "12345678901",
        }
        response = self.client.post('/api/professionals/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['person_type'] == 'PF'
        assert response.data['cpf'] == '12345678901'
        assert response.data['cnpj'] is None

    def test_create_pf_missing_cpf(self):
        """Should fail creating PF without CPF"""
        data = {
            **self.base_data,
            "person_type": "PF",
            # No CPF
        }
        response = self.client.post('/api/professionals/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cpf' in response.data

    def test_create_pf_with_cnpj_should_fail(self):
        data = {
            **self.base_data,
            "person_type": "PF",
            "cpf": "12345678901",
            "cnpj": "12345678000199"
        }
        response = self.client.post('/api/professionals/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cnpj' in response.data

    @patch('core.services.cnpj.service.CNPJService.validate_cnpj')
    def test_create_pj_success(self, mock_validate):
        """Should create PJ with CNPJ successfully (Mocked Service)"""
        mock_validate.return_value = CNPJResult(valid=True, status='ATIVA', message='OK')
        
        data = {
            **self.base_data,
            "person_type": "PJ",
            "cnpj": "12345678000199",
            "company_name": "Minha Empresa LTDA",
            "technical_manager_name": "Gestor Token",
            "technical_manager_cpf": "99988877766"
        }
        response = self.client.post('/api/professionals/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['person_type'] == 'PJ'
        assert response.data['cnpj'] == '12345678000199'
        assert response.data['cpf'] is None

    def test_create_pj_missing_cnpj(self):
        data = {
            **self.base_data,
            "person_type": "PJ",
            # No CNPJ
        }
        response = self.client.post('/api/professionals/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cnpj' in response.data

    def test_create_pj_with_cpf_should_fail(self):
        data = {
            **self.base_data,
            "person_type": "PJ",
            "cnpj": "12345678000199",
            "cpf": "12345678901"
        }
        response = self.client.post('/api/professionals/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cpf' in response.data
