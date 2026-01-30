import logging
import uuid
from ..interfaces import EmailProvider, EmailResult

logger = logging.getLogger(__name__)

class ConsoleEmailProvider(EmailProvider):
    """
    Console/Fallback Implementation of EmailProvider.
    Logs the email content to stdout/logger instead of sending.
    Useful for local development or when credentials are missing.
    """

    def send(self, 
             subject: str, 
             to_emails: list[str], 
             html_content: str, 
             text_content: str,
             from_email: str = None,
             from_name: str = None) -> EmailResult:
        
        # Simulate Message ID
        msg_id = str(uuid.uuid4())
        
        logger.info("="*30)
        logger.info(f"EMAIL SENT (CONSOLE PROVIDER) [MsgID: {msg_id}]")
        logger.info(f"Subject: {subject}")
        logger.info(f"To: {to_emails}")
        logger.info(f"From: {from_email or 'Default'}")
        logger.info("-" * 20)
        logger.info("Body (Text):")
        logger.info(text_content)
        logger.info("-" * 20)
        logger.info("="*30)
        
        return EmailResult(
            success=True,
            provider="console",
            status="simulated",
            message_id=msg_id,
            http_status=200,
            details={"note": "Logged to console"}
        )
