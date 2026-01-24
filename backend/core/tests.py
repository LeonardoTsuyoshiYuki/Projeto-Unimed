from rest_framework.test import APIClient
import pytest

@pytest.mark.django_db
def test_health_check_endpoint():
    client = APIClient()
    response = client.get('/api/health/')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ok'
    assert data['database'] == 'connected'
    assert 'timestamp' in data
