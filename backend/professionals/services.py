import logging
import re
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from core.services.email.factory import get_email_service
from .models import Professional

logger = logging.getLogger(__name__)

def mask_credential(value: str) -> str:
    """Masks CPF/CNPJ generically."""
    if not value: return ""
    digits = re.sub(r'\D', '', value)
    length = len(digits)
    
    if length == 11: # CPF
         return f"{digits[:3]}.***.***-{digits[9:]}"
    elif length == 14: # CNPJ
         return f"{digits[:2]}.***.***/****-{digits[12:]}"
    return value

def send_confirmation_email(professional: Professional, is_status_update=False) -> bool:
    """
    Sends a confirmation email to the professional using Django templates.
    """
    try:
        email_service = get_email_service()
        
        is_pj = professional.person_type == 'PJ'
        name = professional.name
        status_display = professional.get_status_display()
        
        if is_pj:
            doc_label = "CNPJ"
            doc_value = mask_credential(professional.cnpj)
            profile_type = "Pessoa Jurídica"
        else:
            doc_label = "CPF"
            doc_value = mask_credential(professional.cpf)
            profile_type = "Pessoa Física"

        if is_status_update:
            subject = f"Atualização de Status – Unimed: {status_display}"
            intro_msg = f"O status do seu cadastro foi atualizado para: <strong>{status_display}</strong>."
        else:
            subject = "Confirmação de Credenciamento - Unimed"
            intro_msg = "Recebemos seu interesse em se credenciar à nossa rede."

        context = {
            'name': name,
            'intro_msg': intro_msg,
            'profile_type': profile_type,
            'doc_label': doc_label,
            'doc_value': doc_value,
            'status_display': status_display,
            'is_status_update': is_status_update
        }

        html_content = render_to_string('professionals/email/confirmation.html', context)
        text_content = strip_tags(html_content)

        result = email_service.send(
            to=professional.email,
            subject=subject,
            content=text_content,
            html_content=html_content
        )
        
        if result.success:
            logger.info(
                f"Email sent to {professional.email}", 
                extra={
                    "event": "email_send",
                    "professional_id": str(professional.id),
                    "type": professional.person_type,
                    "success": True,
                    "provider": result.provider
                }
            )
            return True
        else:
            logger.error(
                f"Failed to send email to {professional.email}: {result.error}",
                extra={
                    "event": "email_send",
                    "professional_id": str(professional.id),
                    "success": False,
                    "error": result.error
                }
            )
            return False

    except Exception as e:
        logger.error(f"Exception sending email: {str(e)}", exc_info=True)
        return False
