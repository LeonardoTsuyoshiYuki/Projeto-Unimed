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
            from .services import send_confirmation_email
            send_confirmation_email(instance)
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

    def _generate_excel_response(self, queryset, filename):
        import openpyxl
        from django.http import HttpResponse

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'

        workbook = openpyxl.Workbook()
        worksheet = workbook.active
        worksheet.title = 'Profissionais'

        # Strategy A: Universal columns + Specific columns
        columns = [
            'Data Envio', 'Status', 'Tipo', 
            'Nome / Razão Social', 'Nome Fantasia', 
            'CPF', 'CNPJ', 
            'Data Nascimento / Abertura', 
            'Nome Resp. Técnico', 'CPF Resp. Técnico',
            'Email', 'Telefone', 
            'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 'Cidade', 'UF',
            'Formação', 'Instituição', 'Ano Conclusão',
            'Conselho', 'Nº Conselho', 'Área Atuação', 'Experiência (anos)',
            'Data Aprovação/Reprovação', 'Responsável Análise'
        ]

        worksheet.append(columns)

        for prof in queryset:
            approval_date = prof.approved_at or prof.rejected_at
            reviewer = prof.approved_by or prof.rejected_by
            reviewer_name = reviewer.username if reviewer else '-'
            
            # Format dates
            submission_date_str = prof.submission_date.strftime('%d/%m/%Y %H:%M') if prof.submission_date else '-'
            approval_date_str = approval_date.strftime('%d/%m/%Y %H:%M') if approval_date else '-'
            birth_date_str = prof.birth_date.strftime('%d/%m/%Y') if prof.birth_date else '-'

            # Determine fields based on type
            is_pj = prof.person_type == 'PJ'
            
            row = [
                submission_date_str,
                prof.get_status_display(),
                prof.get_person_type_display(), # PF or PJ
                prof.name,
                prof.company_name if is_pj else '-',
                prof.cpf if not is_pj else '-',
                prof.cnpj if is_pj else '-',
                birth_date_str,
                prof.technical_manager_name if is_pj else '-',
                prof.technical_manager_cpf if is_pj else '-',
                prof.email,
                prof.phone,
                prof.zip_code,
                prof.street,
                prof.number,
                prof.complement or '-',
                prof.neighborhood,
                prof.city,
                prof.state,
                prof.education,
                prof.institution,
                prof.graduation_year,
                prof.council_name,
                prof.council_number,
                prof.area_of_action or '-',
                prof.experience_years,
                approval_date_str,
                reviewer_name
            ]
            worksheet.append(row)

        # Adjust column widths (auto-size rough approximation)
        for column_cells in worksheet.columns:
            length = max(len(str(cell.value) or "") for cell in column_cells)
            worksheet.column_dimensions[column_cells[0].column_letter].width = length + 2

        workbook.save(response)
        return response

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def export_excel(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        return self._generate_excel_response(queryset, 'profissionais_unimed.xlsx')

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def export_individual_excel(self, request, pk=None):
        professional = self.get_object()
        
        # Filename format: prestador_<nome>_<cpf|cnpj>_<data>.xlsx
        identifier = professional.cnpj if professional.person_type == 'PJ' else professional.cpf
        clean_identifier = (''.join(filter(str.isdigit, identifier))) if identifier else 'no_doc'
        clean_name = "".join(c for c in professional.name if c.isalnum() or c in (' ', '_')).replace(' ', '_')
        date_str = timezone.now().strftime('%Y%m%d')
        
        filename = f"prestador_{clean_name}_{clean_identifier}_{date_str}.xlsx"
        
        # We pass a list containing the single object to reuse the generation logic
        return self._generate_excel_response([professional], filename)


class DashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # 1. Total Registrations
        total_count = Professional.objects.count()

        # 2. Status Counts
        status_counts = Professional.objects.values('status').annotate(count=Count('id'))
        
        # 3. Recent Counts (30, 60, 90 days)
        sixty_days_ago = now - timedelta(days=60)
        ninety_days_ago = now - timedelta(days=90)
        
        last_30_days = Professional.objects.filter(submission_date__gte=thirty_days_ago).count()
        last_60_days = Professional.objects.filter(submission_date__gte=sixty_days_ago).count()
        last_90_days = Professional.objects.filter(submission_date__gte=ninety_days_ago).count()

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
            'last_60_days': last_60_days,
            'last_90_days': last_90_days,
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
            
        # Return URL JSON. Frontend handles the redirection/download.
        # This keeps headers and auth logic clean.
        return Response({"url": document.file.url})
