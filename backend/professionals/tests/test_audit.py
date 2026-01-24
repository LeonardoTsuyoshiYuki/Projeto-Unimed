import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from professionals.models import Professional, Document
from audit.models import AuditLog

@pytest.mark.django_db
class TestAuditLogic:
    
    @pytest.fixture
    def client(self):
        return APIClient()

    @pytest.fixture
    def professional(self):
        return Professional.objects.create(
            name="Test Audit",
            cpf="77777777777",
            email="audit@test.com",
            phone="11999999999",
            consent_given=True
        )

    @pytest.fixture
    def admin_user(self):
        return User.objects.create_superuser('audit_admin', 'admin@test.com', 'password')

    def test_audit_fields_populated_on_approval(self, client, admin_user, professional):
        """Rule 1 & 2: Audit fields populated on approval"""
        client.force_authenticate(user=admin_user)
        data = {"status": "APPROVED"}
        response = client.patch(f'/api/professionals/{professional.id}/', data)
        assert response.status_code == 200
        
        professional.refresh_from_db()
        assert professional.status == 'APPROVED'
        assert professional.approved_by == admin_user
        assert professional.approved_at is not None
        assert professional.rejected_by is None

    def test_audit_fields_populated_on_rejection(self, client, admin_user, professional):
        """Rule 1 & 2: Audit fields populated on rejection"""
        client.force_authenticate(user=admin_user)
        data = {"status": "REJECTED"}
        response = client.patch(f'/api/professionals/{professional.id}/', data)
        assert response.status_code == 200
        
        professional.refresh_from_db()
        assert professional.status == 'REJECTED'
        assert professional.rejected_by == admin_user
        assert professional.rejected_at is not None
        assert professional.approved_by is None

    def test_audit_log_created_on_status_change(self, client, admin_user, professional):
        """Rule 3: Log status changes"""
        client.force_authenticate(user=admin_user)
        data = {"status": "APPROVED"}
        client.patch(f'/api/professionals/{professional.id}/', data)
        
        log = AuditLog.objects.filter(target_id=str(professional.id), action='STATUS_CHANGE').last()
        assert log is not None
        assert log.user == admin_user
        assert "APPROVED" in log.details

    def test_audit_log_created_on_registration(self, client):
        """Rule 3: Log registration creation"""
        data = {
            "name": "New Log User",
            "cpf": "66666666666",
            "email": "log@test.com",
            "phone": "11888888888",
            "consent_given": True
        }
        response = client.post('/api/professionals/', data)
        assert response.status_code == 201
        
        prof_id = response.data['id']
        log = AuditLog.objects.filter(target_id=prof_id, action='CREATE').first()
        assert log is not None
        assert log.user is None # Anonymous
        assert "New Log User" in log.details
