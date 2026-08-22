import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveType, LeaveStatus
from app.models.payroll import Payroll, PayrollStatus

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dayflow.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Pre-create test accounts if not existing
    admin_u = db.query(User).filter(User.email == "admin@dayflow.com").first()
    if not admin_u:
        admin_u = User(
            employee_id="ADM-001",
            email="admin@dayflow.com",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_verified=True,
            is_active=True
        )
        db.add(admin_u)
        db.flush()
        admin_emp = Employee(user_id=admin_u.id, first_name="Alexander", last_name="Wright", department="Executive", designation="Admin")
        db.add(admin_emp)

    hr_u = db.query(User).filter(User.email == "hr@dayflow.com").first()
    if not hr_u:
        hr_u = User(
            employee_id="HR-001",
            email="hr@dayflow.com",
            password_hash=get_password_hash("Hr@12345"),
            role=UserRole.HR,
            is_verified=True,
            is_active=True
        )
        db.add(hr_u)
        db.flush()
        hr_emp = Employee(user_id=hr_u.id, first_name="Eleanor", last_name="Vance", department="HR", designation="HR Manager")
        db.add(hr_emp)

    emp_u = db.query(User).filter(User.email == "employee@dayflow.com").first()
    if not emp_u:
        emp_u = User(
            employee_id="EMP-001",
            email="employee@dayflow.com",
            password_hash=get_password_hash("Employee@123"),
            role=UserRole.EMPLOYEE,
            is_verified=True,
            is_active=True
        )
        db.add(emp_u)
        db.flush()
        emp = Employee(user_id=emp_u.id, first_name="Marcus", last_name="Chen", department="Engineering", designation="Developer")
        db.add(emp)

    db.commit()
    db.close()

    yield
    # Teardown
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_dayflow.db"):
        try:
            os.remove("./test_dayflow.db")
        except Exception:
            pass


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_auth_headers(client):
    resp = client.post("/api/v1/auth/login", json={"email": "admin@dayflow.com", "password": "Admin@123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def hr_auth_headers(client):
    resp = client.post("/api/v1/auth/login", json={"email": "hr@dayflow.com", "password": "Hr@12345"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_auth_headers(client):
    resp = client.post("/api/v1/auth/login", json={"email": "employee@dayflow.com", "password": "Employee@123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
