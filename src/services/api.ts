import axios from 'axios';
import { BirthRecord, DashboardData, Organization, Doctor, Department, ChildRecord, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (username: string, password: string) => {
  const response = await api.post('/auth.php', { action: 'login', username, password });
  if (response.data.token) {
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await api.post('/auth.php', { action: 'change_password', old_password: oldPassword, new_password: newPassword });
  return response.data;
};

// Birth Records
export const getBirthRecords = async (organizationId?: number, filters?: Record<string, any>) => {
  const params = new URLSearchParams();
  if (organizationId) params.append('organization_id', organizationId.toString());
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  const response = await api.get(`/births.php?${params.toString()}`);
  return response.data;
};

export const getBirthRecord = async (id: number) => {
  const response = await api.get(`/births.php?id=${id}`);
  return response.data;
};

export const createBirthRecord = async (data: Partial<BirthRecord>) => {
  const response = await api.post('/births.php', { action: 'create', ...data });
  return response.data;
};

export const updateBirthRecord = async (id: number, data: Partial<BirthRecord>) => {
  const response = await api.post('/births.php', { action: 'update', id, ...data });
  return response.data;
};

export const deleteBirthRecord = async (id: number) => {
  const response = await api.post('/births.php', { action: 'delete', id });
  return response.data;
};

// Children
export const getChildren = async (birthRecordId: number) => {
  const response = await api.get(`/children.php?birth_record_id=${birthRecordId}`);
  return response.data;
};

export const createChild = async (data: Partial<ChildRecord>) => {
  const response = await api.post('/children.php', { action: 'create', ...data });
  return response.data;
};

export const updateChild = async (id: number, data: Partial<ChildRecord>) => {
  const response = await api.post('/children.php', { action: 'update', id, ...data });
  return response.data;
};

export const deleteChild = async (id: number) => {
  const response = await api.post('/children.php', { action: 'delete', id });
  return response.data;
};

// Dashboard
export const getDashboardData = async (organizationId?: number) => {
  const params = organizationId ? `?organization_id=${organizationId}` : '';
  const response = await api.get(`/dashboard.php${params}`);
  return response.data as DashboardData;
};

// Organizations (superadmin)
export const getOrganizations = async () => {
  const response = await api.get('/organizations.php');
  return response.data as Organization[];
};

export const createOrganization = async (name: string) => {
  const response = await api.post('/organizations.php', { action: 'create', name });
  return response.data;
};

export const updateOrganization = async (id: number, name: string) => {
  const response = await api.post('/organizations.php', { action: 'update', id, name });
  return response.data;
};

// Departments
export const getDepartments = async (organizationId: number) => {
  const response = await api.get(`/departments.php?organization_id=${organizationId}`);
  return response.data as Department[];
};

export const createDepartment = async (organizationId: number, name: string) => {
  const response = await api.post('/departments.php', { action: 'create', organization_id: organizationId, name });
  return response.data;
};

export const deleteDepartment = async (id: number) => {
  const response = await api.post('/departments.php', { action: 'delete', id });
  return response.data;
};

// Doctors
export const getDoctors = async (organizationId: number) => {
  const response = await api.get(`/doctors.php?organization_id=${organizationId}`);
  return response.data as Doctor[];
};

export const createDoctor = async (organizationId: number, fullName: string, specialty: string) => {
  const response = await api.post('/doctors.php', { action: 'create', organization_id: organizationId, full_name: fullName, specialty });
  return response.data;
};

export const deleteDoctor = async (id: number) => {
  const response = await api.post('/doctors.php', { action: 'delete', id });
  return response.data;
};

// Users (admin)
export const getUsers = async (organizationId?: number) => {
  const params = organizationId ? `?organization_id=${organizationId}` : '';
  const response = await api.get(`/users.php${params}`);
  return response.data;
};

export const createUser = async (username: string, password: string, role: string, organizationId?: number) => {
  const response = await api.post('/users.php', { action: 'create', username, password, role, organization_id: organizationId });
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.post('/users.php', { action: 'delete', id });
  return response.data;
};

export default api;
