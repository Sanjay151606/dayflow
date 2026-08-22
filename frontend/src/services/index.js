import api from './api';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('dayflow_token', res.data.access_token);
      localStorage.setItem('dayflow_refresh', res.data.refresh_token);
      localStorage.setItem('dayflow_user', JSON.stringify({
        id: res.data.user_id,
        employee_id: res.data.employee_id,
        email: res.data.email,
        role: res.data.role,
      }));
    }
    return res.data;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, new_password) {
    const res = await api.post('/auth/reset-password', { token, new_password });
    return res.data;
  },

  async changePassword(current_password, new_password) {
    const res = await api.post('/auth/change-password', { current_password, new_password });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_refresh');
    localStorage.removeItem('dayflow_user');
  }
};

export const employeeService = {
  async getEmployees(params) {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  async getMyProfile() {
    const res = await api.get('/employees/me');
    return res.data;
  },
  async updateMyProfile(data) {
    const res = await api.put('/employees/me', data);
    return res.data;
  },
  async getEmployeeById(id) {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  async createEmployee(data) {
    const res = await api.post('/employees', data);
    return res.data;
  },
  async updateEmployee(id, data) {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  async toggleStatus(id) {
    const res = await api.patch(`/employees/${id}/status`);
    return res.data;
  }
};

export const attendanceService = {
  async checkIn(remarks) {
    const res = await api.post('/attendance/check-in', { remarks });
    return res.data;
  },
  async checkOut(remarks) {
    const res = await api.post('/attendance/check-out', { remarks });
    return res.data;
  },
  async getMyAttendance(params) {
    const res = await api.get('/attendance/me', { params });
    return res.data;
  },
  async getMySummary(params) {
    const res = await api.get('/attendance/me/summary', { params });
    return res.data;
  },
  async getAllAttendance(params) {
    const res = await api.get('/attendance', { params });
    return res.data;
  },
  async getEmployeeAttendance(employeeId) {
    const res = await api.get(`/attendance/employee/${employeeId}`);
    return res.data;
  },
  async updateAttendance(id, data) {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  }
};

export const leaveService = {
  async applyLeave(data) {
    const res = await api.post('/leaves', data);
    return res.data;
  },
  async getMyLeaves() {
    const res = await api.get('/leaves/me');
    return res.data;
  },
  async getMySummary() {
    const res = await api.get('/leaves/me/summary');
    return res.data;
  },
  async getAllLeaves(params) {
    const res = await api.get('/leaves', { params });
    return res.data;
  },
  async getLeaveById(id) {
    const res = await api.get(`/leaves/${id}`);
    return res.data;
  },
  async approveLeave(id, comment) {
    const res = await api.patch(`/leaves/${id}/approve`, { comment });
    return res.data;
  },
  async rejectLeave(id, comment) {
    const res = await api.patch(`/leaves/${id}/reject`, { comment });
    return res.data;
  }
};

export const wfhService = {
  async applyWFH(data) {
    const res = await api.post('/wfh', data);
    return res.data;
  },
  async getMyWFH() {
    const res = await api.get('/wfh/me');
    return res.data;
  },
  async getAllWFH(params) {
    const res = await api.get('/wfh', { params });
    return res.data;
  },
  async approveWFH(id, comment) {
    const res = await api.patch(`/wfh/${id}/approve`, { comment });
    return res.data;
  }
};

export const payrollService = {
  async getMyPayroll() {
    const res = await api.get('/payroll/me');
    return res.data;
  },
  async getAllPayroll(params) {
    const res = await api.get('/payroll', { params });
    return res.data;
  },
  async getEmployeePayroll(employeeId) {
    const res = await api.get(`/payroll/employee/${employeeId}`);
    return res.data;
  },
  async createPayroll(data) {
    const res = await api.post('/payroll', data);
    return res.data;
  },
  async updatePayroll(id, data) {
    const res = await api.put(`/payroll/${id}`, data);
    return res.data;
  },
  async getSalarySlip(id) {
    const res = await api.get(`/payroll/${id}/salary-slip`);
    return res.data;
  }
};

export const departmentService = {
  async getDepartments() {
    const res = await api.get('/departments');
    return res.data;
  },
  async createDepartment(data) {
    const res = await api.post('/departments', data);
    return res.data;
  },
  async createDesignation(data) {
    const res = await api.post('/departments/designations', data);
    return res.data;
  }
};

export const settingsService = {
  async getSettings() {
    const res = await api.get('/settings');
    return res.data;
  },
  async updateSettings(settingsMap) {
    const res = await api.put('/settings', { settings: settingsMap });
    return res.data;
  }
};

export const aiService = {
  async queryAssistant(prompt) {
    const res = await api.post('/ai/query', { prompt });
    return res.data;
  },
  async getAnomalies() {
    const res = await api.get('/ai/anomalies');
    return res.data;
  }
};

export const documentService = {
  async uploadDocument(formData) {
    const res = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  async getMyDocuments() {
    const res = await api.get('/documents/me');
    return res.data;
  },
  async getEmployeeDocuments(employeeId) {
    const res = await api.get(`/documents/employee/${employeeId}`);
    return res.data;
  },
  async deleteDocument(id) {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  }
};

export const notificationService = {
  async getMyNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },
  async markRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  async markAllRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  }
};

export const reportService = {
  async getDashboardMetrics() {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },
  getExportUrl(type) {
    return `/api/v1/reports/export/${type}`;
  },
  async getAuditLogs(params) {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  }
};
