import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from professionals.models import Professional, Document
from django.core.files.uploadedfile import SimpleUploadedFile

@pytest.mark.django_db
class TestSecurityHardening:
    def setup_method(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'password')
        self.professional_data = {
            "name": "Test Prof",
            "cpf": "12345678901",
            "email": "test@example.com",
            "phone": "11999999999",
            "birth_date": "1990-01-01",
            "zip_code": "12345678",
            "street": "Rua Teste",
            "number": "123",
            "neighborhood": "Bairro",
            "city": "Cidade",
            "state": "SP",
            "education": "Enfermeiro",
            "institution": "USP",
            "graduation_year": 2020,
            "council_name": "COREN",
            "council_number": "123456",
            "experience_years": 5,
            "consent_given": True
        }
    
    def test_anonymous_cannot_list_professionals(self):
        """Ensure anonymous users cannot list professionals"""
        response = self.client.get('/api/professionals/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_anonymous_cannot_retrieve_professional(self):
        """Ensure anonymous users cannot retrieve specific professional details"""
        # Create one first
        self.client.force_authenticate(user=self.admin)
        prof_res = self.client.post('/api/professionals/', self.professional_data)
        prof_id = prof_res.data['id']
        self.client.logout()

        response = self.client.get(f'/api/professionals/{prof_id}/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_anonymous_cannot_list_documents(self):
        """Ensure anonymous users cannot list documents"""
        response = self.client.get('/api/documents/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_anonymous_can_create_professional(self):
        """Ensure anonymous users CAN register (business requirement)"""
        response = self.client.post('/api/professionals/', self.professional_data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_anonymous_can_upload_document(self):
        """Ensure anonymous users CAN upload documents for a professional"""
        # 1. Create Prof
        prof_res = self.client.post('/api/professionals/', self.professional_data)
        prof_id = prof_res.data['id']

        # 2. Upload
        file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        data = {
            "professional": prof_id,
            "description": "Diploma",
            "file": file
        }
        res = self.client.post('/api/documents/', data, format='multipart')
        assert res.status_code == status.HTTP_201_CREATED

    def test_anonymous_cannot_download_document(self):
        """Ensure anonymous users CANNOT download documents"""
        # 1. Setup (Admin creates prof and doc)
        self.client.force_authenticate(user=self.admin)
        prof = Professional.objects.create(**self.professional_data)
        file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        doc = Document.objects.create(professional=prof, description="Test", file=file)
        self.client.logout()

        # 2. Attempt download
        response = self.client.get(f'/api/documents/{doc.id}/download/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_admin_can_download_document(self):
        """Ensure Admin CAN download documents"""
        self.client.force_authenticate(user=self.admin)
        prof = Professional.objects.create(**self.professional_data)
        file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
        doc = Document.objects.create(professional=prof, description="Test", file=file)
        
        response = self.client.get(f'/api/documents/{doc.id}/download/')
        assert response.status_code == status.HTTP_200_OK
        assert 'Content-Disposition' in response.headers
