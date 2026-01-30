import pytest
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from core.services.cnpj.interfaces import CNPJResult

@pytest.mark.django_db
class TestValidateCNPJEndpoint:
    def setup_method(self):
        self.client = APIClient()

    @patch('core.services.cnpj.service.CNPJService.validate_cnpj')
    def test_validate_cnpj_valid(self, mock_validate):
        """Should return valid=True for active CNPJ"""
        mock_validate.return_value = CNPJResult(valid=True, status='ATIVA', message='CNPJ Ativo.')
        
        response = self.client.get('/api/validate-cnpj/?cnpj=12345678000199')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is True
        assert response.data['status'] == 'ATIVA'

    @patch('core.services.cnpj.service.CNPJService.validate_cnpj')
    def test_validate_cnpj_invalid(self, mock_validate):
        """Should return valid=False for inactive CNPJ"""
        mock_validate.return_value = CNPJResult(
            valid=False, 
            status='BAIXADA', 
            message='CNPJ baixado.'
        )
        
        response = self.client.get('/api/validate-cnpj/?cnpj=12345678000199')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is False
        assert response.data['status'] == 'BAIXADA'

    def test_validate_cnpj_missing_param(self):
        """Should return 400 if cnpj param is missing"""
        response = self.client.get('/api/validate-cnpj/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'MISSING_PARAM'
