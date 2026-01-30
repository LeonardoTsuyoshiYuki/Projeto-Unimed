from .settings import *

# Use a faster password hasher for tests to speed up execution
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use in-memory email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable scaling or complex logic if present
DEBUG = False

# Use SQLite for tests to avoid Postgres dependency
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Redefine REST_FRAMEWORK to ensure Throttling is DISABLED by default
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {}
}

# Ensure Cache is available for tests (required for Throttling test even if disabled globally)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
