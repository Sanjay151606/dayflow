from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, default=2026, nullable=False)
    paid_leave_allocated = Column(Float, default=15.0, nullable=False)
    paid_leave_used = Column(Float, default=0.0, nullable=False)
    sick_leave_allocated = Column(Float, default=10.0, nullable=False)
    sick_leave_used = Column(Float, default=0.0, nullable=False)
    casual_leave_allocated = Column(Float, default=7.0, nullable=False)
    casual_leave_used = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('employee_id', 'year', name='uq_employee_leave_year'),
    )

    # Relationship
    employee = relationship("Employee", back_populates="leave_balance")
