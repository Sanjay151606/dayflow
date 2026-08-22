import pytest
from datetime import date, timedelta


def test_forgot_and_reset_password_flow(client):
    # Request reset token
    res = client.post("/api/v1/auth/forgot-password", json={"email": "employee@dayflow.com"})
    assert res.status_code == 200
    token = res.json().get("reset_token")
    assert token is not None

    # Reset with new password
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "NewEmployeePassword@2026!"
    })
    assert reset_res.status_code == 200

    # Verify login with new password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "employee@dayflow.com",
        "password": "NewEmployeePassword@2026!"
    })
    assert login_res.status_code == 200

    # Reset back to default test password
    reset_back = client.post("/api/v1/auth/forgot-password", json={"email": "employee@dayflow.com"})
    token_back = reset_back.json().get("reset_token")
    client.post("/api/v1/auth/reset-password", json={
        "token": token_back,
        "new_password": "Employee@123"
    })


def test_wfh_request_and_approval_flow(client, employee_auth_headers, hr_auth_headers):
    # Employee applies for WFH
    wfh_data = {
        "start_date": str(date.today() + timedelta(days=20)),
        "end_date": str(date.today() + timedelta(days=21)),
        "reason": "Home office workstation setup"
    }
    apply_res = client.post("/api/v1/wfh", json=wfh_data, headers=employee_auth_headers)
    assert apply_res.status_code == 201
    wfh_id = apply_res.json()["id"]

    # HR approves WFH
    approve_res = client.patch(f"/api/v1/wfh/{wfh_id}/approve", json={"comment": "Approved"}, headers=hr_auth_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"


def test_ai_assistant_query_respects_rbac(client, employee_auth_headers, admin_auth_headers):
    # Employee query
    emp_res = client.post("/api/v1/ai/query", json={"prompt": "What is my salary?"}, headers=employee_auth_headers)
    assert emp_res.status_code == 200
    assert "salary" in emp_res.json()["answer"].lower()

    # Admin query for organization insights
    admin_res = client.post("/api/v1/ai/query", json={"prompt": "How many employees are absent today?"}, headers=admin_auth_headers)
    assert admin_res.status_code == 200
    assert "employees" in admin_res.json()["answer"].lower()


def test_departments_and_designations_management(client, admin_auth_headers):
    dept_res = client.get("/api/v1/departments", headers=admin_auth_headers)
    assert dept_res.status_code == 200
    assert len(dept_res.json()) >= 1
