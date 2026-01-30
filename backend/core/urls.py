from django.urls import path
from .views import health_check, test_email_view

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('test-email/', test_email_view, name='test_email'),
]
