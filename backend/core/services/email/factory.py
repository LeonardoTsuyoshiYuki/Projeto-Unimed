import os
import logging
from django.conf import settings
from .providers.sendgrid import SendGridEmailProvider
from .providers.console import ConsoleEmailProvider
from .service import EmailService

logger = logging.getLogger(__name__)

def get_email_service():
    mode = getattr(settings, 'EMAIL_MODE', 'dev')
    api_key = getattr(settings, 'SENDGRID_API_KEY', None) or os.getenv('SENDGRID_API_KEY')
    
    logger.info(f"Initializing Email Service. Mode: {mode}")

    if mode in ['sandbox', 'prod']:
        if api_key and api_key.startswith('SG.'):
            try:
                # SendGrid provider handles sandbox mode internally based on settings.EMAIL_MODE
                provider = SendGridEmailProvider()
                logger.info(f"Using SendGridEmailProvider (Mode: {mode})")
            except Exception as e:
                logger.error(f"Failed to initialize SendGridProvider: {e}. Falling back to Console.")
                provider = ConsoleEmailProvider()
        else:
            logger.warning(f"SENDGRID_API_KEY invalid or missing in {mode} mode. Falling back to Console.")
            provider = ConsoleEmailProvider()
    else:
        # Dev mode or unknown
        logger.info("Using ConsoleEmailProvider (Dev Mode)")
        provider = ConsoleEmailProvider()
        
    return EmailService(provider)
