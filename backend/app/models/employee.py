from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    department = Column(String(100), nullable=False, default="General")
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(100), nullable=False, default="Staff")
    joining_date = Column(Date, default=date.today, nullable=False)
    employment_type = Column(String(50), default="Full-Time", nullable=False)  # Full-Time, Part-Time, Contract, Intern
    employment_status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE, ON_LEAVE, TERMINATED
    manager_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    # Onboarding & Extended Profile Info
    onboarding_status = Column(String(50), default="COMPLETED", nullable=False)  # PENDING_PROFILE, PENDING_DOCS, COMPLETED
    bank_name = Column(String(100), nullable=True)
    account_number = Column(String(50), nullable=True)
    routing_number = Column(String(50), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee")
    dept_rel = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", foreign_keys="LeaveRequest.employee_id", back_populates="employee", cascade="all, delete-orphan")
    leave_balance = relationship("LeaveBalance", back_populates="employee", uselist=False, cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("Document", foreign_keys="Document.employee_id", back_populates="employee", cascade="all, delete-orphan")
    wfh_requests = relationship("WorkFromHomeRequest", back_populates="employee", cascade="all, delete-orphan")
