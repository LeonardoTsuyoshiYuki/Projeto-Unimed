import pytest
from unittest.mock import patch, MagicMock
from core.services.cnpj.service import CNPJService
from core.services.cnpj.interfaces import CNPJResult

class TestCNPJService:
    @patch('core.services.cnpj.providers.requests.get')
    def test_cnpj_active_success(self, mock_get):
        """Should return valid result when CNPJ is ATIVA"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'cnpj': '12345678000199',
            'descricao_situacao_cadastral': 'ATIVA'
        }
        mock_get.return_value = mock_response

        service = CNPJService()
        result = service.validate_cnpj('12345678000199')

        assert result.valid is True
        assert result.status == 'ATIVA'

    @patch('core.services.cnpj.providers.requests.get')
    def test_cnpj_inactive_failure(self, mock_get):
        """Should return invalid result when CNPJ is BAIXADA"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'cnpj': '12345678000199',
            'descricao_situacao_cadastral': 'BAIXADA'
        }
        mock_get.return_value = mock_response

        service = CNPJService()
        result = service.validate_cnpj('12345678000199')

        assert result.valid is False
        assert result.status == 'BAIXADA'
        assert 'CNPJ com situação BAIXADA' in result.message

    @patch('core.services.cnpj.providers.requests.get')
    def test_cnpj_not_found_failure(self, mock_get):
        """Should return invalid result when CNPJ is not found"""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        service = CNPJService()
        result = service.validate_cnpj('12345678000199')

        assert result.valid is False
        assert result.status == 'NOT_FOUND'

    @patch('core.services.cnpj.providers.requests.get')
    def test_network_error_failure(self, mock_get):
        """Should return invalid result on network exception"""
        mock_get.side_effect = Exception("Network Error")

        service = CNPJService()
        result = service.validate_cnpj('12345678000199')

        assert result.valid is False
        assert result.status == 'EXCEPTION'
