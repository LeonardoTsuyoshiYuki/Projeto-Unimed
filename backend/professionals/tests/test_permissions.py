import pytest
import uuid
from datetime import date
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from professionals.models import Professional

@pytest.mark.django_db
class TestAccessControl:
    
    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def professional(self):
        return Professional.objects.create(
            name="Test Pro",
            cpf="99999999999",
            email="pro@test.com",
            phone="11999999999",
            birth_date=date(2000, 1, 1),
            zip_code="00000-000",
            street="Pro Blvd",
            number="1",
            neighborhood="ProHood",
            city="ProCity",
            state="SP",
            education="Enfermeiro",
            institution="Pro University",
            graduation_year=2010,
            council_name="COREN",
            council_number="99999",
            experience_years=10,
            consent_given=True
        )

    @pytest.fixture
    def admin_user(self):
        return User.objects.create_superuser('admin', 'admin@test.com', 'password')

    def test_anonymous_can_create_registration(self, client):
        """Rule 1a: Anonymous user CAN create a registration"""
        data = {
            "name": "Public User",
            "cpf": "88888888888",
            "email": "public@test.com",
            "phone": "11888888888",
            "birth_date": "2000-01-01",
            "zip_code": "00000-000",
            "street": "Public St",
            "number": "5",
            "neighborhood": "PublicHood",
            "city": "PublicCity",
            "state": "SP",
            "education": "Enfermeiro",
            "institution": "Public Uni",
            "graduation_year": 2022,
            "council_name": "None",
            "council_number": "00000",
            "experience_years": 1,
            "consent_given": True
        }
        response = client.post('/api/professionals/', data)
        assert response.status_code == 201

    def test_anonymous_cannot_update_status(self, client, professional):
        """Rule 1b: Anonymous user CANNOT approve or reject (update)"""
        data = {"status": "APPROVED"}
        response = client.patch(f'/api/professionals/{professional.id}/', data)
        assert response.status_code == 401

    def test_admin_can_approve_registration(self, client, admin_user, professional):
        """Rule 2a: Staff/admin user CAN approve a registration"""
        client.force_authenticate(user=admin_user)
        data = {"status": "APPROVED"}
        response = client.patch(f'/api/professionals/{professional.id}/', data)
        assert response.status_code == 200
        professional.refresh_from_db()
        assert professional.status == 'APPROVED'

    def test_admin_can_reject_registration(self, client, admin_user, professional):
        """Rule 2b: Staff/admin user CAN reject a registration"""
        client.force_authenticate(user=admin_user)
        data = {"status": "REJECTED"}
        response = client.patch(f'/api/professionals/{professional.id}/', data)
        assert response.status_code == 200
        professional.refresh_from_db()
        assert professional.status == 'REJECTED'
