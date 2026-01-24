from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfessionalViewSet, DocumentViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'professionals', ProfessionalViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'admin/dashboard', DashboardViewSet, basename='admin-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
