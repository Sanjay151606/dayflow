import pytest
from datetime import date, timedelta


def test_employee_cannot_access_other_payroll(client, employee_auth_headers):
    # Employee cannot access general payroll list
    res = client.get("/api/v1/payroll", headers=employee_auth_headers)
    assert res.status_code == 403

    # Employee cannot access other employee payroll
    res2 = client.get("/api/v1/payroll/employee/1", headers=employee_auth_headers)
    assert res2.status_code == 403


def test_employee_cannot_approve_leave(client, employee_auth_headers):
    res = client.patch("/api/v1/leaves/1/approve", json={"comment": "Trying to self-approve"}, headers=employee_auth_headers)
    assert res.status_code == 403


def test_hr_can_approve_leave(client, hr_auth_headers, db_session):
    # Apply a leave as an employee first
    from app.models.employee import Employee
    from app.models.leave import LeaveRequest, LeaveType, LeaveStatus
    emp = db_session.query(Employee).first()
    leave = LeaveRequest(
        employee_id=emp.id,
        leave_type=LeaveType.PAID,
        start_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=12),
        reason="Testing approval workflow",
        status=LeaveStatus.PENDING
    )
    db_session.add(leave)
    db_session.commit()
    db_session.refresh(leave)

    res = client.patch(f"/api/v1/leaves/{leave.id}/approve", json={"comment": "Approved by HR"}, headers=hr_auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"


def test_admin_can_manage_payroll(client, admin_auth_headers, db_session):
    from app.models.employee import Employee
    emp = db_session.query(Employee).first()
    
    pay_data = {
        "employee_id": emp.id,
        "basic_salary": 5000.0,
        "allowances": 1000.0,
        "deductions": 500.0,
        "pay_period": "2026-09",
        "status": "PENDING"
    }
    res = client.post("/api/v1/payroll", json=pay_data, headers=admin_auth_headers)
    assert res.status_code == 201
    assert res.json()["net_salary"] == 5500.0  # 5000 + 1000 - 500


def test_attendance_punch_flow_and_duplicate(client, employee_auth_headers):
    # Punch in
    res = client.post("/api/v1/attendance/check-in", json={"remarks": "Morning shift"}, headers=employee_auth_headers)
    # Could be 200 or 400 if already punched today
    assert res.status_code in [200, 400]

    # Punch out
    res_out = client.post("/api/v1/attendance/check-out", json={"remarks": "Evening checkout"}, headers=employee_auth_headers)
    assert res_out.status_code == 200
    assert res_out.json()["check_out"] is not None
