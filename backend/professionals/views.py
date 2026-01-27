from rest_framework import viewsets, permissions, parsers, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, F
from django.db.models.functions import TruncMonth
from .models import Professional, Document
from .serializers import ProfessionalSerializer, DocumentSerializer, ProfessionalManagementSerializer
from audit.models import AuditLog

import logging
logger = logging.getLogger(__name__)

class ProfessionalViewSet(viewsets.ModelViewSet):
    queryset = Professional.objects.all()
    serializer_class = ProfessionalSerializer
    permission_classes = [permissions.AllowAny] # Open for registration, restricted for listing?
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'education']
    search_fields = ['name', 'cpf', 'email']
    ordering_fields = ['submission_date', 'name']
    ordering = ['-submission_date']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()] # Admin only for list/retrieve/update

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update'] and self.request.user.is_staff:
            return ProfessionalManagementSerializer
        return ProfessionalSerializer

    def perform_create(self, serializer):
        try:
            instance = serializer.save()
            logger.info(
                "Registration created", 
                extra={
                    "event": "registration_created", 
                    "professional_id": str(instance.id),
                    "status": instance.status
                }
            )
            
            # Log action
            AuditLog.objects.create(
                user=self.request.user if self.request.user.is_authenticated else None,
                action='CREATE',
                target_model='Professional',
                target_id=str(instance.id),
                details=f"Professional registered: {instance.name}"
            )
            # Email notification
            send_mail(
                'Recebemos seu cadastro - Unimed',
                f'Olá {instance.name}, recebemos seu cadastro e ele está em análise.',
                'no-reply@unimed.com',
                [instance.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(
                "Registration creation failed", 
                extra={"event": "registration_failed", "error": str(e)}
            )
            raise e

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        
        instance = serializer.save()
        
        if instance.status != old_status:
             logger.info(
                "Status changed", 
                extra={
                    "event": "status_change", 
                    "professional_id": str(instance.id),
                    "old_status": old_status,
                    "new_status": instance.status,
                    "changed_by": self.request.user.username if self.request.user.is_authenticated else "anonymous"
                }
            )

        if self.request.user.is_authenticated:
            # Audit Logic
            if instance.status == 'APPROVED' and not instance.approved_by:
                instance.approved_by = self.request.user
                instance.approved_at = timezone.now()
                instance.save()
            elif instance.status == 'REJECTED' and not instance.rejected_by:
                instance.rejected_by = self.request.user
                instance.rejected_at = timezone.now()
                instance.save()
            
            if instance.status != old_status:
                 AuditLog.objects.create(
                    user=self.request.user,
                    action='STATUS_CHANGE',
                    target_model='Professional',
                    target_id=str(instance.id),
                    details=f"Status changed to {instance.status}"
                )
            
            # Log Internal Notes changes
            if instance.internal_notes != old_instance.internal_notes:
                AuditLog.objects.create(
                    user=self.request.user,
                    action='UPDATE',
                    target_model='Professional',
                    target_id=str(instance.id),
                    details="Internal notes updated"
                )

            # Send email on status change
            if instance.status != old_status:
                send_mail(
                    f'Atualização de Status - Unimed: {instance.get_status_display()}',
                    f'Olá {instance.name}, o status do seu cadastro mudou para: {instance.get_status_display()}.',
                    'no-reply@unimed.com',
                    [instance.email],
                    fail_silently=True,
                )





    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def history(self, request, pk=None):
        professional = self.get_object()
        from audit.models import AuditLog
        from audit.serializers import AuditLogSerializer
        
        logs = AuditLog.objects.filter(
            target_model='Professional',
            target_id=str(professional.id)
        ).order_by('-timestamp')
        
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class DashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # 1. Total Registrations
        total_count = Professional.objects.count()

        # 2. Status Counts
        status_counts = Professional.objects.values('status').annotate(count=Count('id'))
        
        # 3. Last 30 Days Count
        last_30_days = Professional.objects.filter(submission_date__gte=thirty_days_ago).count()

        # 4. Yearly Variation (Continuous Yearly)
        # We will get the last 12 months for the trend
        one_year_ago = now - timedelta(days=365)
        monthly_volume = Professional.objects.filter(
            submission_date__gte=one_year_ago
        ).annotate(
            month=TruncMonth('submission_date')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # 5. Efficiency (Analyzed this month)
        # Count unique professionals whose status changed or was updated restricted to admin actions
        from audit.models import AuditLog
        analyzed_this_month = AuditLog.objects.filter(
            timestamp__year=now.year,
            timestamp__month=now.month,
            action__in=['STATUS_CHANGE', 'UPDATE']
        ).values('target_id').distinct().count()

        # 6. Average Analysis Time (for those finalized)
        # We calculate diff between submission and approval/rejection
        from django.db.models.functions import Coalesce
        
        avg_time_data = Professional.objects.filter(
            status__in=['APPROVED', 'REJECTED']
        ).annotate(
            end_date=Coalesce('approved_at', 'rejected_at')
        ).aggregate(
            avg_time=Avg(F('end_date') - F('submission_date'))
        )
        
        avg_time_seconds = avg_time_data['avg_time'].total_seconds() if avg_time_data['avg_time'] else 0
        avg_time_days = round(avg_time_seconds / 86400, 1)

        return Response({
            'total_registrations': total_count,
            'last_30_days': last_30_days,
            'status_counts': status_counts,
            'yearly_variation': monthly_volume,
            'analyzed_this_month': analyzed_this_month,
            'avg_analysis_time_days': avg_time_days,
        })

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [permissions.IsAdminUser] # Default to Admin only

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()] # Allow anon upload during registration
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def download(self, request, pk=None):
        document = self.get_object()
        if not document.file:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        
        from django.http import FileResponse
        response = FileResponse(document.file.open('rb'))
        response['Content-Disposition'] = f'attachment; filename="{document.file.name.split("/")[-1]}"'
        return response
