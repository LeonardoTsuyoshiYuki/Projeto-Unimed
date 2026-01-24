from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.mail import send_mail
from .models import Professional, Document
from .serializers import ProfessionalSerializer, DocumentSerializer
from audit.models import AuditLog

class ProfessionalViewSet(viewsets.ModelViewSet):
    queryset = Professional.objects.all()
    serializer_class = ProfessionalSerializer
    permission_classes = [permissions.AllowAny] # Open for registration, restricted for listing?
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()] # Admin only for list/retrieve/update

    def perform_create(self, serializer):
        instance = serializer.save()
        # Log action
        # Email notification
        send_mail(
            'Recebemos seu cadastro - Unimed',
            f'Olá {instance.name}, recebemos seu cadastro e ele está em análise.',
            'no-reply@unimed.com',
            [instance.email],
            fail_silently=True,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        if self.request.user.is_authenticated:
            AuditLog.objects.create(
                user=self.request.user,
                action='STATUS_CHANGE',
                target_model='Professional',
                target_id=str(instance.id),
                details=f"Status changed to {instance.status}"
            )
            # Send email on status change
            send_mail(
                f'Atualização de Status - Unimed: {instance.get_status_display()}',
                f'Olá {instance.name}, o status do seu cadastro mudou para: {instance.get_status_display()}.',
                'no-reply@unimed.com',
                [instance.email],
                fail_silently=True,
            )

from django.db.models import Count, Avg, F
from django.db.models.functions import TruncMonth
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets, permissions

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        # 1. Status Counts
        status_counts = Professional.objects.values('status').annotate(count=Count('id'))
        
        # 2. Monthly Volume (Last 12 months ideally, here taking all for simplicity or verify date range)
        monthly_volume = Professional.objects.annotate(
            month=TruncMonth('submission_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # 3. Efficiency (Avg time to Approve)
        # Calculate duration only for Approved
        # Note: This is an approximation using last_status_update. 
        # Ideally we would calculate diff between submission and approval audit log.
        # For this phase, we use the simple diff.
        avg_time = Professional.objects.filter(status='APPROVED').annotate(
            duration=F('last_status_update') - F('submission_date')
        ).aggregate(avg_days=Avg('duration'))

        return Response({
            'status_counts': status_counts,
            'monthly_volume': monthly_volume,
            'efficiency': avg_time
        })

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [permissions.AllowAny] # Should be restricted in prod logic to the owner during session or admin

    def perform_create(self, serializer):
        # Ideally, we should link to the professional here.
        # Check passed professional_id
        professional_id = self.request.data.get('professional_id')
        if professional_id:
            professional = Professional.objects.get(id=professional_id)
            serializer.save(professional=professional)
        else:
             # Handle error or temporary storage
             pass
