from .settings import *

# Use a faster password hasher for tests to speed up execution
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use in-memory email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable scaling or complex logic if present
DEBUG = False

# Ensure we don't accidentally touch the production DB (sanity check)
# Django Tests create a separate DB by default (test_unimed_db)
