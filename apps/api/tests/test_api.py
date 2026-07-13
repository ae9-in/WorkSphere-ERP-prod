from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data

def test_unauthenticated_protected_route():
    response = client.get("/api/v1/settings")
    assert response.status_code == 401
    assert "detail" in response.json() or "message" in response.json()
