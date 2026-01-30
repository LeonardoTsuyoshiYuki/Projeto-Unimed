import os
from unittest.mock import patch, MagicMock
from core.services.email.providers.sendgrid import SendGridEmailProvider
import pytest
from django.test import override_settings

class TestSendGridProvider:
    
    @override_settings(SENDGRID_API_KEY="SG.test", EMAIL_MODE="dev")
    def test_sendgrid_provider_init(self):
        with patch("core.services.email.providers.sendgrid.SendGridAPIClient") as MockClient:
            provider = SendGridEmailProvider()
            assert provider.client is not None
            MockClient.assert_called_with("SG.test")

    @override_settings(SENDGRID_API_KEY="")
    @patch.dict(os.environ, {}, clear=True)
    def test_sendgrid_provider_raises_error_without_key(self):
        with pytest.raises(Exception) as excinfo:
            SendGridEmailProvider()
        assert "SENDGRID_API_KEY não configurada" in str(excinfo.value)

    @override_settings(SENDGRID_API_KEY="SG.test", EMAIL_MODE="dev")
    def test_send_email_calls_client(self):
         with patch("core.services.email.providers.sendgrid.SendGridAPIClient") as MockClient:
            mock_instance = MockClient.return_value
            mock_response = MagicMock()
            mock_response.status_code = 202
            mock_response.headers = {'X-Message-Id': 'msg-123'}
            mock_response.body = b'success'
            mock_instance.send.return_value = mock_response
            
            provider = SendGridEmailProvider()
            result = provider.send_email("to@test.com", "Subject", "Content")
            
            assert result.success is True
            assert result.status == "sent"
            assert result.message_id == "msg-123"
            mock_instance.send.assert_called_once()
