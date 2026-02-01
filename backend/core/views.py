from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone
from .services.email.factory import get_email_service
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify system and database status.
    """
    try:
        # Check DB connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        return Response({
            "status": "ok",
            "timestamp": timezone.now().isoformat(),
            "database": "connected"
        })
    except Exception as e:
        return Response({
            "status": "error",
            "timestamp": timezone.now().isoformat(),
            "database": "disconnected",
            "error": str(e)
        }, status=503)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def test_email_view(request):
    """
    Diagnostic endpoint to verify email configuration.
    Expects 'to' in body.
    Returns detailed diagnostics.
    """
    import uuid
    request_id = str(uuid.uuid4())
    to_email = request.data.get('to')
    
    if not to_email:
        return Response({"error": "field 'to' is required"}, status=400)
    
    email_service = get_email_service()
    mode = getattr(settings, 'EMAIL_MODE', 'unknown')
    
    logger.info(
        "Diagnostic email request started",
        extra={"event": "email_test_start", "request_id": request_id, "to": to_email}
    )

    result = email_service.send(
        subject="Diagnóstico de Envio - Unimed",
        to=to_email,
        content="Este é um email de teste para validar a infraestrutura de envio."
    )
    
    # Construct Sanitized Diagnostic Response
    response_data = {
        "success": result.success,
        "provider": result.provider,
        "mode": mode,
        "status": result.status,
        "message_id": result.message_id,
        "details": result.details,
        "error": result.error if result.error else None,
        "request_id": request_id
    }
    
    if not result.success and result.debug:
        logger.info(f"Diagnostic debug info: {result.debug}")

    logger.info(
        "Diagnostic email finished",
        extra={
            "event": "email_test_end", 
            "request_id": request_id, 
            "success": result.success,
            "status": result.status
        }
    )

    status_code = 200 if result.success else 500
    return Response(response_data, status=status_code)

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_cnpj_view(request):
    """
    Public endpoint to validate CNPJ status before form submission.
    Query Param: ?cnpj=00000000000000
    """
    cnpj = request.query_params.get('cnpj')
    
    if not cnpj:
        return Response({
            "valid": False,
            "status": "MISSING_PARAM",
            "message": "Parâmetro 'cnpj' é obrigatório."
        }, status=400)
        
    from .services.cnpj.service import CNPJService
    
    # Instantiate service (uses default provider)
    service = CNPJService()
    result = service.validate_cnpj(cnpj)
    
    # We return 200 even for invalid CNPJs because the request itself was successful,
    # and the validity is part of the payload. 
    # Unless it's a structural error (like missing param).
    # However, for easier frontend logic, we can keep it 200 and trust the 'valid' flag.
    
    return Response({
        "valid": result.valid,
        "status": result.status,
        "message": result.message
    })
