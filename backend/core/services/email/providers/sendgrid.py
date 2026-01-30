import os
import logging
import json
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, MailSettings, SandBoxMode
from django.conf import settings
from ..interfaces import EmailResult

logger = logging.getLogger(__name__)

class SendGridEmailProvider:
    def __init__(self):
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None) or os.getenv("SENDGRID_API_KEY")
        self.from_email = getattr(settings, 'SENDGRID_FROM_EMAIL', "no-reply@unimed.com.br")
        self.mode = getattr(settings, 'EMAIL_MODE', 'dev')

        if not self.api_key:
            # Should be handled by Factory, but good to have safety
            raise Exception("SENDGRID_API_KEY não configurada")

        self.client = SendGridAPIClient(self.api_key)

    def send_email(self, to_email: str, subject: str, content: str) -> EmailResult:
        # Pre-send Log
        log_data = {
            "event": "email_send_attempt",
            "provider": "sendgrid",
            "mode": self.mode,
            "to": to_email,
            "from": self.from_email,
            "subject": subject
        }
        logger.info(json.dumps(log_data))

        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                plain_text_content=content
            )

            # Sandbox Mode Handling
            if self.mode == 'sandbox':
                mail_settings = MailSettings()
                mail_settings.sandbox_mode = SandBoxMode(enable=True)
                message.mail_settings = mail_settings

            response = self.client.send(message)
            
            # Post-send Log & Result
            success = 200 <= response.status_code < 300
            
            # Extract Message-ID if available in headers (SendGrid often puts it in 'X-Message-Id')
            headers = {k: v for k, v in response.headers.items()}
            msg_id = headers.get('X-Message-Id') or headers.get('x-message-id')

            result = EmailResult(
                success=success,
                provider="sendgrid",
                status="sent" if success else "failed",
                http_status=response.status_code,
                message_id=msg_id,
                details={
                    "mode": self.mode,
                    "headers": str(headers), # Convert to string to avoid deep nesting issues in details
                    "body": response.body.decode('utf-8') if response.body else ""
                }
            )

            logger.info(json.dumps({
                "event": "email_send_result",
                "status": response.status_code,
                "message_id": msg_id,
                "success": success
            }))

            return result

        except Exception as e:
            logger.error(json.dumps({
                "event": "email_send_exception",
                "error": str(e)
            }))
            return EmailResult(
                success=False,
                provider="sendgrid",
                status="exception",
                error=str(e),
                details={"mode": self.mode}
            )
