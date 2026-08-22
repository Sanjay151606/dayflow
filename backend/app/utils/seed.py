from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.department import Department, Designation
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveType, LeaveStatus
from app.models.leave_balance import LeaveBalance
from app.models.payroll import Payroll, PayrollStatus
from app.models.notification import Notification
from app.models.wfh import WorkFromHomeRequest, WFHStatus
from app.models.settings import SystemSetting


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Department).first():
            print("Database already contains departments. Skipping duplicate seed.")
            return

        print("Enriching database with comprehensive seed data...")

        # 1. Create Core Departments
        depts_data = [
            {"name": "Executive Management", "code": "EXEC", "desc": "Corporate governance and strategy"},
            {"name": "Engineering", "code": "ENG", "desc": "Software design, cloud infrastructure, and DevOps"},
            {"name": "Human Resources", "code": "HR", "desc": "Talent acquisition, operations, and payroll"},
            {"name": "Product Design", "code": "DESIGN", "desc": "User interface, design systems, and product research"},
            {"name": "Marketing", "code": "MKTG", "desc": "Brand strategy, growth hacking, and communications"}
        ]

        created_depts = {}
        for d_info in depts_data:
            dept = Department(name=d_info["name"], code=d_info["code"], description=d_info["desc"], status="ACTIVE")
            db.add(dept)
            db.flush()
            created_depts[d_info["name"]] = dept

        # 2. Create Designations
        designations_data = [
            {"dept": "Executive Management", "title": "Chief Operating Officer", "level": "Executive"},
            {"dept": "Human Resources", "title": "HR Director", "level": "Executive"},
            {"dept": "Human Resources", "title": "HR Generalist", "level": "Mid-Level"},
            {"dept": "Engineering", "title": "Senior Full-Stack Architect", "level": "Senior"},
            {"dept": "Engineering", "title": "Cloud DevOps Engineer", "level": "Mid-Level"},
            {"dept": "Product Design", "title": "Lead UI/UX Designer", "level": "Lead"},
            {"dept": "Marketing", "title": "Growth Marketing Lead", "level": "Lead"}
        ]
        for des in designations_data:
            des_obj = Designation(
                department_id=created_depts[des["dept"]].id,
                title=des["title"],
                level=des["level"],
                status="ACTIVE"
            )
            db.add(des_obj)

        # 3. Create Admin User
        admin_user = db.query(User).filter(User.email == "admin@dayflow.com").first()
        if not admin_user:
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
                department_id=created_depts["Executive Management"].id,
                designation="Chief Operating Officer",
                joining_date=date(2022, 1, 15),
                employment_type="Full-Time",
                onboarding_status="COMPLETED"
            )
            db.add(admin_emp)

        # 4. Create HR User
        hr_user = db.query(User).filter(User.email == "hr@dayflow.com").first()
        if not hr_user:
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
                department_id=created_depts["Human Resources"].id,
                designation="HR Director",
                joining_date=date(2022, 3, 1),
                employment_type="Full-Time",
                onboarding_status="COMPLETED"
            )
            db.add(hr_emp)

        # 5. Create Staff Employees
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
                "deductions": 700.0,
                "bank": "Chase Bank",
                "acc": "••••4921",
                "emergency_name": "Linda Chen",
                "emergency_phone": "+1 (555) 302-8473"
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
                "deductions": 650.0,
                "bank": "Wells Fargo",
                "acc": "••••1184",
                "emergency_name": "Robert Jenkins",
                "emergency_phone": "+1 (555) 492-1191"
            }
        ]

        for ed in employees_data:
            existing_u = db.query(User).filter(User.email == ed["email"]).first()
            if not existing_u:
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
                    department_id=created_depts[ed["dept"]].id,
                    designation=ed["designation"],
                    joining_date=ed["joining"],
                    employment_type=ed["type"],
                    onboarding_status="COMPLETED",
                    bank_name=ed["bank"],
                    account_number=ed["acc"],
                    emergency_contact_name=ed["emergency_name"],
                    emergency_contact_phone=ed["emergency_phone"]
                )
                db.add(emp)
                db.flush()

                # Leave Balance
                lb = LeaveBalance(
                    employee_id=emp.id,
                    year=2026,
                    paid_leave_allocated=15,
                    paid_leave_used=3,
                    sick_leave_allocated=10,
                    sick_leave_used=2,
                    casual_leave_allocated=7,
                    casual_leave_used=1
                )
                db.add(lb)

        db.commit()
        print("Database enriched successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error enriching seed: {e}")
    finally:
        db.close()
