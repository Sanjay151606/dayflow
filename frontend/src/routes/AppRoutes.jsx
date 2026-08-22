import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';

// Auth Pages
import { Login, Register, ForgotPassword, ResetPassword } from '../pages/auth/AuthPages';

// Employee Pages
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';
import { MyProfile } from '../pages/employee/MyProfile';
import { MyAttendance } from '../pages/employee/MyAttendance';
import { MyLeaves } from '../pages/employee/MyLeaves';
import { MyPayroll } from '../pages/employee/MyPayroll';

// Admin / HR Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { EmployeeDirectory } from '../pages/admin/EmployeeDirectory';
import { AttendanceManager } from '../pages/admin/AttendanceManager';
import { LeaveApprovals } from '../pages/admin/LeaveApprovals';
import { PayrollManager } from '../pages/admin/PayrollManager';
import { ReportsAnalytics } from '../pages/admin/ReportsAnalytics';
import { DocumentManager } from '../pages/admin/DocumentManager';
import { DepartmentManager } from '../pages/admin/DepartmentManager';
import { SystemSettings } from '../pages/admin/SystemSettings';
import { AuditLogs } from '../pages/admin/AuditLogs';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return user.role === 'ADMIN' || user.role === 'HR' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/employee/dashboard" replace />
    );
  }

  return <Layout>{children}</Layout>;
};

export const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'ADMIN' || user.role === 'HR' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Login />
          )
        }
      />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/attendance"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
            <MyAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leaves"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
            <MyLeaves />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/payroll"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
            <MyPayroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/documents"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN']}>
            <MyProfile />
          </ProtectedRoute>
        }
      />

      {/* Admin / HR Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <EmployeeDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <DepartmentManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <AttendanceManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leaves"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <LeaveApprovals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payroll"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <PayrollManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <ReportsAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <DocumentManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SystemSettings />
          </ProtectedRoute>
        }
      />

      {/* Default Catch All */}
      <Route
        path="*"
        element={
          user ? (
            user.role === 'ADMIN' || user.role === 'HR' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};
