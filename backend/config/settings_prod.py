from .settings import *
import os

# Security
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')

# Static Files (WhiteNoise)
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Database (Ensure it uses env vars which are already in settings.py, so no change needed unless using URL)

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

# Simple JWT (Secure Cookies in prod?)
# For now, keep as is, but could add secure-only if using cookie auth (we use header auth)

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
