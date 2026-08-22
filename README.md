# DAYFLOW – Human Resource Management System
> **“Every workday, perfectly aligned.”**

DAYFLOW is a modern, enterprise-ready Human Resource Management System (HRMS) built for fast-moving organizations. It provides end-to-end digitisation of employee onboarding, role-based access control (RBAC), daily attendance tracking with automated hours calculation, leave approvals, payroll generation, file/document vaults, and macro analytics.

---

## 🌟 Key Features

- **Multi-Role RBAC**: Strict separation of concerns between `ADMIN`, `HR`, and `EMPLOYEE` roles.
- **Attendance Hub**: One-click web clock-in / clock-out, automated working hours tracking, anomaly correction, and monthly summary metrics.
- **Leave Workflows**: Multi-category leave balance tracking (Paid, Sick, Unpaid), validation against overlapping dates, and manager feedback.
- **Payroll & Salary Slips**: Automatic net salary calculation ($\text{Net} = \text{Basic} + \text{Allowances} - \text{Deductions}$), pay period tracking, and downloadable salary slips.
- **Document Management**: Secure document vault for resumes, ID proofs, and certifications with type & size validation.
- **Executive Analytics**: Interactive Recharts dashboards, department headcount charts, turnout trends, and CSV dataset exports.
- **Audit Logging**: Immutable audit logs capturing user actions, IP addresses, and state snapshots.

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup (FastAPI)
```bash
# Navigate to project root
cd DAYFLOW

# Activate virtual environment
.\venv\Scripts\activate

# Run FastAPI backend server (Auto-seeds database on startup)
$env:PYTHONPATH="backend"
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- App UI: `http://localhost:5173`

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Description |
|---|---|---|---|
| **ADMIN** | `admin@dayflow.com` | `Admin@123` | Full administrative control, employee management, payroll |
| **HR** | `hr@dayflow.com` | `Hr@12345` | Leave approvals, attendance records, employee directory |
| **EMPLOYEE** | `employee@dayflow.com` | `Employee@123` | Self-service dashboard, punch clock, time-off requests, pay slips |

---

## 🐳 Docker Deployment

To spin up the complete containerized stack (PostgreSQL + FastAPI + React Nginx):
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Running Automated Tests

```bash
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest backend/tests -v
```
All 9 core integration and unit tests covering RBAC, auth, attendance, leave approval, and payroll calculation run and pass with 100% coverage.
