from typing import Optional, List
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import io
import csv
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveType, LeaveStatus
from app.models.payroll import Payroll
from app.models.audit_log import AuditLog
from app.schemas.report import DashboardMetrics, DepartmentHeadcountItem
from app.api.deps import require_hr_or_admin, get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    today = date.today()
    total_employees = db.query(Employee).join(User).filter(User.is_active == True).count()

    today_attendance = db.query(Attendance).filter(Attendance.date == today).all()
    present_today = sum(1 for a in today_attendance if a.status == AttendanceStatus.PRESENT)
    absent_today = sum(1 for a in today_attendance if a.status == AttendanceStatus.ABSENT)
    half_day_today = sum(1 for a in today_attendance if a.status == AttendanceStatus.HALF_DAY)

    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).count()

    current_month_str = today.strftime("%Y-%m")
    approved_leaves_month = db.query(LeaveRequest).filter(
        LeaveRequest.status == LeaveStatus.APPROVED,
        func.extract('month', LeaveRequest.start_date) == today.month,
        func.extract('year', LeaveRequest.start_date) == today.year
    ).count()

    # Department distribution
    dept_counts = db.query(
        Employee.department, func.count(Employee.id)
    ).join(User).filter(User.is_active == True).group_by(Employee.department).all()

    dept_distribution = [
        DepartmentHeadcountItem(department=d[0] or "General", count=d[1])
        for d in dept_counts
    ]

    # Weekly attendance trends (last 7 days)
    weekly_attendance = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_att = db.query(Attendance).filter(Attendance.date == d).all()
        p_cnt = sum(1 for a in day_att if a.status == AttendanceStatus.PRESENT)
        a_cnt = sum(1 for a in day_att if a.status == AttendanceStatus.ABSENT)
        h_cnt = sum(1 for a in day_att if a.status == AttendanceStatus.HALF_DAY)
        l_cnt = sum(1 for a in day_att if a.status == AttendanceStatus.LEAVE)
        weekly_attendance.append({
            "date": d.strftime("%a (%d/%m)"),
            "present": p_cnt,
            "absent": a_cnt,
            "half_day": h_cnt,
            "leave": l_cnt
        })

    # Monthly attendance summary (past 6 months)
    monthly_attendance = []
    for i in range(5, -1, -1):
        m_date = today.replace(day=1) - timedelta(days=i*30)
        m_str = m_date.strftime("%b %Y")
        p_cnt = db.query(Attendance).filter(
            func.extract('month', Attendance.date) == m_date.month,
            func.extract('year', Attendance.date) == m_date.year,
            Attendance.status == AttendanceStatus.PRESENT
        ).count()
        monthly_attendance.append({"month": m_str, "present": p_cnt})

    # Leave distribution
    leave_types = [LeaveType.PAID, LeaveType.SICK, LeaveType.UNPAID]
    leave_distribution = []
    for lt in leave_types:
        cnt = db.query(LeaveRequest).filter(LeaveRequest.leave_type == lt).count()
        leave_distribution.append({"name": lt.value, "value": cnt})

    # Total payroll this month
    payrolls_month = db.query(Payroll).filter(Payroll.pay_period.like(f"{current_month_str}%")).all()
    total_payroll_month = sum(p.net_salary for p in payrolls_month)

    return DashboardMetrics(
        total_employees=total_employees,
        present_today=present_today,
        absent_today=absent_today,
        half_day_today=half_day_today,
        pending_leaves=pending_leaves,
        approved_leaves_month=approved_leaves_month,
        total_payroll_month=total_payroll_month,
        department_distribution=dept_distribution,
        weekly_attendance=weekly_attendance,
        monthly_attendance=monthly_attendance,
        leave_distribution=leave_distribution
    )


@router.get("/export/{report_type}")
def export_report_csv(
    report_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "employees":
        writer.writerow(["ID", "Employee ID", "First Name", "Last Name", "Email", "Department", "Designation", "Employment Type", "Joining Date", "Status"])
        employees = db.query(Employee).join(User).all()
        for e in employees:
            writer.writerow([
                e.id,
                e.user.employee_id if e.user else "",
                e.first_name,
                e.last_name,
                e.user.email if e.user else "",
                e.department,
                e.designation,
                e.employment_type,
                e.joining_date,
                "Active" if (e.user and e.user.is_active) else "Inactive"
            ])
    elif report_type == "attendance":
        writer.writerow(["ID", "Employee Name", "Date", "Status", "Check In", "Check Out", "Working Hours", "Remarks"])
        records = db.query(Attendance).join(Employee).order_by(desc(Attendance.date)).limit(1000).all()
        for a in records:
            writer.writerow([
                a.id,
                f"{a.employee.first_name} {a.employee.last_name}" if a.employee else "",
                a.date,
                a.status.value,
                a.check_in.strftime("%H:%M:%S") if a.check_in else "",
                a.check_out.strftime("%H:%M:%S") if a.check_out else "",
                a.working_hours,
                a.remarks or ""
            ])
    elif report_type == "payroll":
        writer.writerow(["ID", "Employee Name", "Pay Period", "Basic Salary", "Allowances", "Deductions", "Net Salary", "Status", "Payment Date"])
        payrolls = db.query(Payroll).join(Employee).order_by(desc(Payroll.pay_period)).all()
        for p in payrolls:
            writer.writerow([
                p.id,
                f"{p.employee.first_name} {p.employee.last_name}" if p.employee else "",
                p.pay_period,
                p.basic_salary,
                p.allowances,
                p.deductions,
                p.net_salary,
                p.status.value,
                p.payment_date or ""
            ])
    elif report_type == "leaves":
        writer.writerow(["ID", "Employee Name", "Leave Type", "Start Date", "End Date", "Reason", "Status", "Approved By", "Comment"])
        leaves = db.query(LeaveRequest).join(Employee).order_by(desc(LeaveRequest.created_at)).all()
        for l in leaves:
            writer.writerow([
                l.id,
                f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "",
                l.leave_type.value,
                l.start_date,
                l.end_date,
                l.reason,
                l.status.value,
                l.approved_by or "",
                l.approval_comment or ""
            ])
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown report type")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dayflow_{report_type}_report.csv"}
    )
