from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll
from app.models.wfh import WorkFromHomeRequest, WFHStatus


class AIAssistantService:
    @staticmethod
    def process_query(db: Session, user: User, prompt: str) -> Dict[str, Any]:
        prompt_lower = prompt.lower().strip()
        employee = db.query(Employee).filter(Employee.user_id == user.id).first()
        
        # 1. EMPLOYEE SCOPE QUERIES
        if any(w in prompt_lower for w in ["leave", "leaves", "vacation", "time off", "balance"]):
            if user.role == UserRole.EMPLOYEE or ("my" in prompt_lower):
                if not employee:
                    return {"answer": "No employee profile was found associated with your account.", "context_type": "LEAVES", "suggested_actions": []}
                
                leaves = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee.id).all()
                pending = sum(1 for l in leaves if l.status == LeaveStatus.PENDING)
                approved = sum(1 for l in leaves if l.status == LeaveStatus.APPROVED)
                
                # Estimate remaining
                paid_used = sum((l.end_date - l.start_date).days + 1 for l in leaves if l.status == LeaveStatus.APPROVED and l.leave_type.value == "PAID")
                sick_used = sum((l.end_date - l.start_date).days + 1 for l in leaves if l.status == LeaveStatus.APPROVED and l.leave_type.value == "SICK")
                
                paid_bal = max(0, 15 - paid_used)
                sick_bal = max(0, 10 - sick_used)

                return {
                    "answer": f"You currently have {paid_bal} Paid Leave days and {sick_bal} Sick Leave days remaining in your 2026 balance. You have {pending} pending request(s) undergoing review.",
                    "context_type": "LEAVES",
                    "suggested_actions": ["Apply for Leave", "View Leave History"]
                }
            elif user.role in [UserRole.ADMIN, UserRole.HR]:
                pending_cnt = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).count()
                approved_cnt = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.APPROVED).count()
                return {
                    "answer": f"Organization-wide, there are currently {pending_cnt} pending leave requests awaiting approval, with {approved_cnt} requests approved so far this cycle.",
                    "context_type": "HR_LEAVES",
                    "suggested_actions": ["Review Pending Leaves", "Export Leave Ledger"]
                }

        if any(w in prompt_lower for w in ["salary", "payroll", "pay", "earnings", "slip"]):
            if user.role == UserRole.EMPLOYEE or ("my" in prompt_lower):
                if not employee:
                    return {"answer": "No employee record linked to account.", "context_type": "PAYROLL", "suggested_actions": []}
                
                pay = db.query(Payroll).filter(Payroll.employee_id == employee.id).order_by(Payroll.pay_period.desc()).first()
                if not pay:
                    return {"answer": "Your payroll has not been generated for the latest period yet. Please check back shortly or consult HR.", "context_type": "PAYROLL", "suggested_actions": []}
                
                return {
                    "answer": f"Your latest generated payroll is for period {pay.pay_period}. Base Salary: ${pay.basic_salary:,.2f}, Allowances: +${pay.allowances:,.2f}, Deductions: -${pay.deductions:,.2f}, resulting in a Net Salary of ${pay.net_salary:,.2f} ({pay.status.value}).",
                    "context_type": "PAYROLL",
                    "suggested_actions": ["View Salary Slip", "Open Payroll History"]
                }
            elif user.role in [UserRole.ADMIN, UserRole.HR]:
                total_payroll = db.query(func.sum(Payroll.net_salary)).scalar() or 0.0
                return {
                    "answer": f"The total disbursed/processed payroll across all recorded periods is approximately ${total_payroll:,.2f}.",
                    "context_type": "HR_PAYROLL",
                    "suggested_actions": ["Run Monthly Payroll", "Download Payroll Report"]
                }

        if any(w in prompt_lower for w in ["attendance", "hours", "check in", "absent", "presence", "clock"]):
            if user.role == UserRole.EMPLOYEE or ("my" in prompt_lower):
                if not employee:
                    return {"answer": "Employee profile missing.", "context_type": "ATTENDANCE", "suggested_actions": []}
                today_rec = db.query(Attendance).filter(Attendance.employee_id == employee.id, Attendance.date == date.today()).first()
                if today_rec:
                    clock_in_str = today_rec.check_in.strftime("%H:%M") if today_rec.check_in else "Not clocked in"
                    return {
                        "answer": f"For today ({date.today()}), your attendance status is {today_rec.status.value}. Clock-in recorded at {clock_in_str} with {today_rec.working_hours} hours logged.",
                        "context_type": "ATTENDANCE",
                        "suggested_actions": ["View Attendance Calendar", "Clock Out"]
                    }
                else:
                    return {
                        "answer": f"You have not clocked in for today ({date.today()}) yet. Please use the punch clock on your dashboard.",
                        "context_type": "ATTENDANCE",
                        "suggested_actions": ["Clock In Now"]
                    }
            elif user.role in [UserRole.ADMIN, UserRole.HR]:
                today = date.today()
                total_emps = db.query(Employee).count()
                present_today = db.query(Attendance).filter(Attendance.date == today, Attendance.status == AttendanceStatus.PRESENT).count()
                absent_today = total_emps - present_today
                return {
                    "answer": f"Today ({today}), {present_today} out of {total_emps} employees are marked Present. Approximately {max(0, absent_today)} employees are absent or have not clocked in yet.",
                    "context_type": "HR_ATTENDANCE",
                    "suggested_actions": ["Open Attendance Hub", "Export Daily Attendance"]
                }

        # General intelligent assistant fallback respecting RBAC
        role_label = user.role.value
        return {
            "answer": f"Hello! As your DAYFLOW HR Assistant ({role_label} Access), I can assist you with attendance checks, leave balance inquiries, salary slip details, and policy workflows. How can I help you today?",
            "context_type": "GENERAL",
            "suggested_actions": ["Check Leave Balance", "Check Today Attendance", "View Latest Salary Slip"]
        }


def detect_attendance_anomalies(db: Session) -> List[Dict[str, Any]]:
    anomalies = []
    employees = db.query(Employee).all()
    today = date.today()
    start_30 = today - timedelta(days=30)

    for emp in employees:
        records = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.date >= start_30
        ).all()

        absent_count = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        half_day_count = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
        late_count = sum(1 for r in records if r.status == AttendanceStatus.LATE or (r.check_in and r.check_in.hour >= 10))

        if absent_count >= 3:
            anomalies.append({
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department,
                "type": "HIGH_ABSENTEEISM",
                "severity": "HIGH",
                "insight": f"{emp.first_name} has had {absent_count} absences in the last 30 days."
            })
        if late_count >= 3:
            anomalies.append({
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department,
                "type": "FREQUENT_TARDINESS",
                "severity": "MEDIUM",
                "insight": f"{emp.first_name} has recorded {late_count} late arrivals (clock-in after 10:00 AM) this month."
            })
        if half_day_count >= 3:
            anomalies.append({
                "employee_id": emp.id,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department,
                "type": "REPEATED_HALF_DAYS",
                "severity": "LOW",
                "insight": f"{emp.first_name} logged {half_day_count} half-day shifts in the past 30 days."
            })

    return anomalies
