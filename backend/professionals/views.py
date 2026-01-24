from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.mail import send_mail
from django.utils import timezone
from .models import Professional, Document
from .serializers import ProfessionalSerializer, DocumentSerializer, ProfessionalManagementSerializer
from audit.models import AuditLog

class ProfessionalViewSet(viewsets.ModelViewSet):
    queryset = Professional.objects.all()
    serializer_class = ProfessionalSerializer
    permission_classes = [permissions.AllowAny] # Open for registration, restricted for listing?
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()] # Admin only for list/retrieve/update

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update'] and self.request.user.is_staff:
            return ProfessionalManagementSerializer
        return ProfessionalSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
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

    def perform_update(self, serializer):
        instance = serializer.save()
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

        return Response({
            'total_registrations': total_count,
            'last_30_days': last_30_days,
            'status_counts': status_counts,
            'yearly_variation': monthly_volume,
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
