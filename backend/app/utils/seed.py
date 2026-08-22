from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveType, LeaveStatus
from app.models.payroll import Payroll, PayrollStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database with realistic initial data...")

        # 1. Create ADMIN User & Employee
        admin_user = User(
            employee_id="ADM-001",
            email="admin@dayflow.com",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_verified=True,
            is_active=True
        )
        db.add(admin_user)
        db.flush()

        admin_emp = Employee(
            user_id=admin_user.id,
            first_name="Alexander",
            last_name="Wright",
            phone="+1 (555) 019-2831",
            address="742 Evergreen Terrace, Springfield, OR",
            date_of_birth=date(1985, 4, 12),
            gender="Male",
            department="Executive Management",
            designation="Chief Operating Officer & Admin",
            joining_date=date(2022, 1, 15),
            employment_type="Full-Time"
        )
        db.add(admin_emp)

        # 2. Create HR User & Employee
        hr_user = User(
            employee_id="HR-001",
            email="hr@dayflow.com",
            password_hash=get_password_hash("Hr@12345"),
            role=UserRole.HR,
            is_verified=True,
            is_active=True
        )
        db.add(hr_user)
        db.flush()

        hr_emp = Employee(
            user_id=hr_user.id,
            first_name="Eleanor",
            last_name="Vance",
            phone="+1 (555) 014-9923",
            address="104 Berkeley Square, London, UK",
            date_of_birth=date(1990, 8, 24),
            gender="Female",
            department="Human Resources",
            designation="HR Director",
            joining_date=date(2022, 3, 1),
            employment_type="Full-Time"
        )
        db.add(hr_emp)

        # 3. Create Standard Employees
        employees_data = [
            {
                "emp_id": "EMP-001",
                "email": "employee@dayflow.com",
                "password": "Employee@123",
                "role": UserRole.EMPLOYEE,
                "first_name": "Marcus",
                "last_name": "Chen",
                "phone": "+1 (555) 302-8472",
                "address": "452 Innovation Way, Austin, TX",
                "dob": date(1993, 11, 5),
                "gender": "Male",
                "dept": "Engineering",
                "designation": "Senior Full-Stack Architect",
                "joining": date(2023, 2, 1),
                "type": "Full-Time",
                "basic": 8500.0,
                "allowances": 1200.0,
                "deductions": 700.0
            },
            {
                "emp_id": "EMP-002",
                "email": "sarah.jenkins@dayflow.com",
                "password": "Employee@123",
                "role": UserRole.EMPLOYEE,
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "phone": "+1 (555) 492-1190",
                "address": "88 Pinecrest Blvd, Seattle, WA",
                "dob": date(1995, 6, 18),
                "gender": "Female",
                "dept": "Product Design",
                "designation": "Lead UI/UX Designer",
                "joining": date(2023, 5, 10),
                "type": "Full-Time",
                "basic": 7800.0,
                "allowances": 950.0,
                "deductions": 650.0
            },
            {
                "emp_id": "EMP-003",
                "email": "david.ross@dayflow.com",
                "password": "Employee@123",
                "role": UserRole.EMPLOYEE,
                "first_name": "David",
                "last_name": "Ross",
                "phone": "+1 (555) 872-4019",
                "address": "120 Market Street, San Francisco, CA",
                "dob": date(1991, 2, 28),
                "gender": "Male",
                "dept": "Marketing",
                "designation": "Growth Marketing Lead",
                "joining": date(2023, 8, 15),
                "type": "Full-Time",
                "basic": 6900.0,
                "allowances": 800.0,
                "deductions": 550.0
            },
            {
                "emp_id": "EMP-004",
                "email": "priya.sharma@dayflow.com",
                "password": "Employee@123",
                "role": UserRole.EMPLOYEE,
                "first_name": "Priya",
                "last_name": "Sharma",
                "phone": "+1 (555) 912-7634",
                "address": "304 Silicon Vista, San Jose, CA",
                "dob": date(1996, 9, 14),
                "gender": "Female",
                "dept": "Engineering",
                "designation": "Cloud DevOps Engineer",
                "joining": date(2024, 1, 10),
                "type": "Full-Time",
                "basic": 7400.0,
                "allowances": 900.0,
                "deductions": 600.0
            }
        ]

        created_employees = []
        for ed in employees_data:
            user = User(
                employee_id=ed["emp_id"],
                email=ed["email"],
                password_hash=get_password_hash(ed["password"]),
                role=ed["role"],
                is_verified=True,
                is_active=True
            )
            db.add(user)
            db.flush()

            emp = Employee(
                user_id=user.id,
                first_name=ed["first_name"],
                last_name=ed["last_name"],
                phone=ed["phone"],
                address=ed["address"],
                date_of_birth=ed["dob"],
                gender=ed["gender"],
                department=ed["dept"],
                designation=ed["designation"],
                joining_date=ed["joining"],
                employment_type=ed["type"]
            )
            db.add(emp)
            db.flush()
            created_employees.append((emp, ed))

        # 4. Generate Past Attendance Records (Last 14 days)
        today = date.today()
        all_emps = [admin_emp, hr_emp] + [e[0] for e in created_employees]

        for i in range(13, -1, -1):
            att_date = today - timedelta(days=i)
            # Skip Sundays
            if att_date.weekday() == 6:
                continue

            for emp in all_emps:
                # Marcus (EMP-001) has check-in today
                if i == 0 and emp.user_id == created_employees[0][0].user_id:
                    check_in_time = datetime.combine(att_date, datetime.min.time()) + timedelta(hours=9, minutes=2)
                    att = Attendance(
                        employee_id=emp.id,
                        date=att_date,
                        check_in=check_in_time,
                        check_out=None,
                        status=AttendanceStatus.PRESENT,
                        working_hours=3.5,
                        remarks="On-time punch in"
                    )
                    db.add(att)
                    continue

                # Normal past records
                check_in_time = datetime.combine(att_date, datetime.min.time()) + timedelta(hours=8, minutes=55)
                check_out_time = datetime.combine(att_date, datetime.min.time()) + timedelta(hours=17, minutes=30)
                att = Attendance(
                    employee_id=emp.id,
                    date=att_date,
                    check_in=check_in_time,
                    check_out=check_out_time,
                    status=AttendanceStatus.PRESENT,
                    working_hours=8.58,
                    remarks="Regular workday"
                )
                db.add(att)

        # 5. Generate Sample Leave Requests
        marcus_emp = created_employees[0][0]
        leave1 = LeaveRequest(
            employee_id=marcus_emp.id,
            leave_type=LeaveType.PAID,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
            reason="Family vacation and annual travel.",
            status=LeaveStatus.PENDING
        )
        leave2 = LeaveRequest(
            employee_id=created_employees[1][0].id,
            leave_type=LeaveType.SICK,
            start_date=today - timedelta(days=4),
            end_date=today - timedelta(days=3),
            reason="Severe migraine and fever recovery.",
            status=LeaveStatus.APPROVED,
            approved_by=hr_user.id,
            approval_comment="Approved. Take care and rest well!"
        )
        db.add(leave1)
        db.add(leave2)

        # 6. Generate Sample Payroll Records
        periods = ["2026-06", "2026-07", "2026-08"]
        for period in periods:
            for emp, ed in created_employees:
                net = ed["basic"] + ed["allowances"] - ed["deductions"]
                pay = Payroll(
                    employee_id=emp.id,
                    basic_salary=ed["basic"],
                    allowances=ed["allowances"],
                    deductions=ed["deductions"],
                    net_salary=net,
                    pay_period=period,
                    payment_date=today.replace(day=28) if period != "2026-08" else None,
                    status=PayrollStatus.PAID if period != "2026-08" else PayrollStatus.PROCESSED
                )
                db.add(pay)

        # 7. Generate Initial Notifications
        for user in [admin_user, hr_user, created_employees[0][0].user]:
            notif1 = Notification(
                user_id=user.id,
                title="Welcome to DAYFLOW HRMS",
                message="Welcome to DAYFLOW – Every workday, perfectly aligned. Your portal is ready.",
                type="SUCCESS",
                is_read=False
            )
            db.add(notif1)

        db.commit()
        print("Database seeded successfully with Admin, HR, and Employee demo accounts!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
