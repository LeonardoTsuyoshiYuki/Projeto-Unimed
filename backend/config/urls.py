from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.conf.urls.static import static

def healthcheck(request):
    return JsonResponse({"status": "ok"})
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda request: HttpResponse("API OK"), name='root_check'),
    path('health/', healthcheck, name='health_check'),
    path('api/', include('professionals.urls')),
    path('api/', include('core.urls')), # Health check
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
