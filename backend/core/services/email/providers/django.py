import logging
from django.core.mail import EmailMultiAlternatives
from smtplib import SMTPException
import socket
from django.conf import settings
from ..interfaces import EmailProvider, EmailResult

logger = logging.getLogger(__name__)

class DjangoEmailProvider(EmailProvider):
    """
    Implementation of EmailProvider using Django's core mail system.
    This allows leveraging any configured EMAIL_BACKEND (SMTP, console, etc).
    """

    def send(self, 
             subject: str, 
             to_emails: list[str], 
             html_content: str, 
             text_content: str,
             from_email: str = None,
             from_name: str = None) -> EmailResult:
        
        # Use default from email if not provided
        default_sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@unimed.com.br')
        sender = from_email or default_sender
        
        if from_name:
            # If from_name is provided, we format it. 
            # If from_email was also provided, use it, else use default_sender address part
            email_addr = from_email or default_sender.split('<')[-1].split('>')[0].strip()
            sender = f"{from_name} <{email_addr}>"

        timeout = getattr(settings, 'EMAIL_TIMEOUT', 20)

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=sender,
                to=to_emails
            )
            msg.attach_alternative(html_content, "text/html")
            
            # send() returns the number of successfully delivered messages
            # Note: Django's SMTP backend doesn't natively support timeout in .send()
            # but it is set globally in settings.EMAIL_TIMEOUT for the connection.
            sent_count = msg.send(fail_silently=False)
            
            success = sent_count > 0
            
            logger.info(
                f"Email sent via DjangoEmailProvider to {to_emails}",
                extra={
                    "event": "email_send",
                    "provider": "django",
                    "success": success,
                    "to": to_emails,
                    "subject": subject
                }
            )
            
            return EmailResult(
                success=success,
                provider="django",
                status="sent" if success else "failed",
                details={"sent_count": sent_count, "timeout": timeout}
            )

        except SMTPException as e:
            logger.error(
                f"SMTP Protocol Error: {str(e)}",
                extra={
                    "event": "email_send_fail", 
                    "provider": "django",
                    "error_type": "smtp_protocol",
                    "to": to_emails,
                    "error": str(e)
                }
            )
            return EmailResult(
                success=False,
                provider="django",
                status="smtp_error",
                error=f"SMTP Error: {str(e)}",
                debug=str(e)
            )
        except (socket.error, ConnectionError) as e:
             logger.error(
                f"SMTP Connection Error: {str(e)}",
                extra={
                    "event": "email_send_fail", 
                    "provider": "django",
                    "error_type": "connection_error",
                    "to": to_emails,
                    "error": str(e)
                }
            )
             return EmailResult(
                success=False,
                provider="django",
                status="connection_error",
                error="Could not connect to email server",
                debug=str(e)
            )
        except Exception as e:
            logger.error(
                f"DjangoEmailProvider unexpected exception: {str(e)}",
                extra={
                    "event": "email_send_fail", 
                    "provider": "django",
                    "error_type": "generic",
                    "success": False,
                    "to": to_emails,
                    "error": str(e)
                }
            )
            return EmailResult(
                success=False,
                provider="django",
                status="exception",
                error="Internal delivery error",
                debug=str(e)
            )
