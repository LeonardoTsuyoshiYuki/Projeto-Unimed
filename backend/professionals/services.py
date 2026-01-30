import logging
from core.services.email.factory import get_email_service
from .models import Professional

logger = logging.getLogger(__name__)

def send_confirmation_email(professional: Professional) -> bool:
    """
    Sends a confirmation email to the professional after successful registration
    using the EmailService factory.
    
    Args:
        professional (Professional): The professional instance just created.
        
    Returns:
        bool: True if email sent successfully, False otherwise.
    """
    try:
        email_service = get_email_service()
        
        content = f"""
Olá,

Seu cadastro foi realizado com sucesso em nosso sistema.

Em breve nossa equipe fará a validação das informações e você receberá novas instruções por e-mail.

Atenciosamente,
Equipe Unimed
        """

        result = email_service.send(
            to=professional.email,
            subject="Confirmação de Cadastro – Unimed",
            content=content.strip()
        )
        
        # Check success status from Result Object
        if result.success:
            logger.info(
                f"Confirmation email sent to {professional.email}", 
                extra={
                    "event": "email_sent", 
                    "professional_id": str(professional.id),
                    "provider": result.provider,
                    "msg_id": result.message_id
                }
            )
            return True
        else:
            logger.error(
                f"Failed to send confirmation email to {professional.email}. Status: {result.status}", 
                extra={
                    "event": "email_failed", 
                    "professional_id": str(professional.id),
                    "provider": result.provider,
                    "error": result.error,
                    "details": result.details
                }
            )
            return False

    except Exception as e:
        logger.error(
            f"Exception sending email to {professional.email}: {str(e)}", 
            extra={
                "event": "email_failed", 
                "professional_id": str(professional.id),
                "error": str(e)
            }
        )
        return False
