from django.contrib import admin
from .models import Professional, Document

@admin.register(Professional)
class ProfessionalAdmin(admin.ModelAdmin):
    list_display = ('name_display', 'person_type', 'identifier', 'email', 'status', 'submission_date')
    list_filter = ('status', 'person_type', 'submission_date')
    search_fields = ('name', 'cpf', 'cnpj', 'email', 'company_name')
    readonly_fields = ('submission_date', 'consent_date')
    
    fieldsets = (
        ('Identificação', {
            'fields': ('person_type', 'status', 'name', 'company_name', 'cpf', 'cnpj')
        }),
        ('Responsável Técnico (PJ)', {
            'fields': ('technical_manager_name', 'technical_manager_cpf'),
            'classes': ('collapse',),
        }),
        ('Contato', {
            'fields': ('email', 'phone')
        }),
        ('Dados Pessoais/Profissionais', {
            'fields': ('birth_date', 'education', 'institution', 'graduation_year', 'council_name', 'council_number', 'experience_years', 'area_of_action')
        }),
        ('Endereço', {
            'fields': ('zip_code', 'street', 'number', 'complement', 'neighborhood', 'city', 'state')
        }),
        ('LGPD & Auditoria', {
             'fields': ('consent_given', 'consent_date', 'submission_date', 'internal_notes', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at')
        })
    )

    def name_display(self, obj):
        if obj.person_type == 'PJ':
            return f"{obj.name} ({obj.company_name})"
        return obj.name
    name_display.short_description = 'Nome / Razão Social'

    def identifier(self, obj):
        return obj.cpf if obj.person_type == 'PF' else obj.cnpj
    identifier.short_description = 'CPF/CNPJ'

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('description', 'professional', 'uploaded_at')
