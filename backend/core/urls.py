from django.urls import path
from .views import health_check, test_email_view, validate_cnpj_view

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('test-email/', test_email_view, name='test_email'),
    path('validate-cnpj/', validate_cnpj_view, name='validate_cnpj'),
]
