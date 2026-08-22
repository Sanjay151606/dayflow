import pytest
from app.models.user import User, UserRole


def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@dayflow.com",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin@dayflow.com"


def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@dayflow.com",
        "password": "WrongPassword!123"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_register_user_and_validation(client):
    # Missing uppercase/symbol test
    weak_resp = client.post("/api/v1/auth/register", json={
        "employee_id": "EMP-999",
        "email": "weak@dayflow.com",
        "password": "weak",
        "role": "EMPLOYEE"
    })
    assert weak_resp.status_code == 422

    # Valid registration
    valid_resp = client.post("/api/v1/auth/register", json={
        "employee_id": "EMP-888",
        "email": "valid.user@dayflow.com",
        "password": "SecurePassword@123",
        "role": "EMPLOYEE",
        "first_name": "Test",
        "last_name": "User"
    })
    assert valid_resp.status_code == 201
    assert valid_resp.json()["email"] == "valid.user@dayflow.com"


def test_current_user_endpoint(client, employee_auth_headers):
    response = client.get("/api/v1/auth/me", headers=employee_auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "employee@dayflow.com"
