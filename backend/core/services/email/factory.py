import os
import logging
from django.conf import settings
from .providers.sendgrid import SendGridEmailProvider
from .providers.console import ConsoleEmailProvider
from .providers.django import DjangoEmailProvider
from .service import EmailService

logger = logging.getLogger(__name__)

def get_email_service():
    mode = getattr(settings, 'EMAIL_MODE', 'dev').lower()
    provider_name = getattr(settings, 'EMAIL_PROVIDER', 'console' if mode == 'dev' else 'django')
    
    logger.info(f"Initializing Email Service. Mode: {mode}, Provider: {provider_name}")

    # Fallback to console if using django provider but SMTP host/password is missing
    if provider_name == 'django':
        smtp_pass = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        if not smtp_pass and mode == 'prod':
            logger.warning("EMAIL_HOST_PASSWORD missing in production. Falling back to Console.")
            return EmailService(ConsoleEmailProvider())
        return EmailService(DjangoEmailProvider())
    
    if provider_name == 'sendgrid':
        api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        if api_key and api_key.startswith('SG.'):
            return EmailService(SendGridEmailProvider())
        logger.warning("SENDGRID_API_KEY invalid or missing. Falling back to Console.")

    # Default / Dev mode / Fallback
    return EmailService(ConsoleEmailProvider())
