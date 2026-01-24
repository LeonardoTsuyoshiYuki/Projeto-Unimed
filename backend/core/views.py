from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone

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
