from core.services.email.service import EmailService
from core.services.email.interfaces import EmailResult

class FakeProvider:
    def send(self, to_emails, subject, text_content, html_content, from_email=None, from_name=None):
        return EmailResult(
            success=True, 
            provider="fake", 
            status="sent", 
            http_status=202
        )

def test_email_service_send():
    service = EmailService(FakeProvider())
    result = service.send("test@test.com", "Test", "Hello")
    assert result.success is True
    assert result.status == "sent"
