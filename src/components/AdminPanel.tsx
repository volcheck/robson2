import React, { useState, useEffect } from 'react';
import { Organization, Department, Doctor, User } from '../types';
import {
  getOrganizations, createOrganization, updateOrganization,
  getDepartments, createDepartment, deleteDepartment,
  getDoctors, createDoctor, deleteDoctor,
  getUsers, createUser, deleteUser,
  changePassword
} from '../services/api';

interface AdminPanelProps {
  user: User;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onClose }) => {
  const [activeSection, setActiveSection] = useState<'org' | 'dept' | 'doctors' | 'users' | 'password'>('org');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number>(user.organization_id || 0);

  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    loadOrgs();
    if (user.organization_id) {
      loadDepartments(user.organization_id);
      loadDoctors(user.organization_id);
    }
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadDepartments(selectedOrgId);
      loadDoctors(selectedOrgId);
    }
  }, [selectedOrgId]);

  const loadOrgs = async () => {
    try {
      const data = await getOrganizations();
      setOrganizations(data);
    } catch (err) { console.error(err); }
  };

  const loadDepartments = async (orgId: number) => {
    try {
      const data = await getDepartments(orgId);
      setDepartments(data);
    } catch (err) { console.error(err); }
  };

  const loadDoctors = async (orgId: number) => {
    try {
      const data = await getDoctors(orgId);
      setDoctors(data);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers(user.organization_id || undefined);
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  const handleAddOrg = async () => {
    if (!newOrgName.trim()) return;
    try {
      await createOrganization(newOrgName);
      setNewOrgName('');
      loadOrgs();
    } catch (err) { alert('Ошибка'); }
  };

  const handleAddDept = async () => {
    if (!newDeptName.trim() || !selectedOrgId) return;
    try {
      await createDepartment(selectedOrgId, newDeptName);
      setNewDeptName('');
      loadDepartments(selectedOrgId);
    } catch (err) { alert('Ошибка'); }
  };

  const handleDeleteDept = async (id: number) => {
    if (!window.confirm('Удалить отделение?')) return;
    try {
      await deleteDepartment(id);
      loadDepartments(selectedOrgId);
    } catch (err) { alert('Ошибка'); }
  };

  const handleAddDoctor = async () => {
    if (!newDoctorName.trim() || !selectedOrgId) return;
    try {
      await createDoctor(selectedOrgId, newDoctorName, newDoctorSpecialty);
      setNewDoctorName('');
      setNewDoctorSpecialty('');
      loadDoctors(selectedOrgId);
    } catch (err) { alert('Ошибка'); }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!window.confirm('Удалить врача?')) return;
    try {
      await deleteDoctor(id);
      loadDoctors(selectedOrgId);
    } catch (err) { alert('Ошибка'); }
  };

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    try {
      await createUser(newUsername, newPassword, newUserRole, user.role === 'superadmin' ? selectedOrgId : user.organization_id || undefined);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err) { alert('Ошибка'); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) { alert('Ошибка'); }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      alert('Пароли не совпадают');
      return;
    }
    try {
      await changePassword(oldPass, newPass);
      alert('Пароль изменён');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) { alert('Ошибка смены пароля'); }
  };

  const sections = [
    { key: 'org', label: 'Организации', icon: 'fa-building' },
    { key: 'dept', label: 'Отделения', icon: 'fa-hospital' },
    { key: 'doctors', label: 'Врачи', icon: 'fa-user-md' },
    { key: 'users', label: 'Пользователи', icon: 'fa-users' },
    { key: 'password', label: 'Сменить пароль', icon: 'fa-key' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            <i className="fas fa-cog mr-2"></i>
            Панель администратора
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-48 border-b md:border-b-0 md:border-r border-gray-200 p-2">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => { setActiveSection(s.key as any); if (s.key === 'users') loadUsers(); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 mb-1 transition-colors ${
                  activeSection === s.key ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${s.icon} w-4 text-center`}></i>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 max-h-[60vh] overflow-y-auto">
            {/* Organizations */}
            {activeSection === 'org' && (
              <div>
                {user.role === 'superadmin' && (
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="Название организации"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button onClick={handleAddOrg} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      <i className="fas fa-plus mr-1"></i> Добавить
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm font-medium">{org.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedOrgId(org.id)}
                          className={`px-2 py-1 text-xs rounded ${selectedOrgId === org.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {selectedOrgId === org.id ? 'Выбрана' : 'Выбрать'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Departments */}
            {activeSection === 'dept' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Название отделения"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button onClick={handleAddDept} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    <i className="fas fa-plus mr-1"></i> Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">{dept.name}</span>
                      <button onClick={() => handleDeleteDept(dept.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  ))}
                  {departments.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Нет отделений</p>}
                </div>
              </div>
            )}

            {/* Doctors */}
            {activeSection === 'doctors' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    placeholder="ФИО врача"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={newDoctorSpecialty}
                    onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                    placeholder="Специальность"
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button onClick={handleAddDoctor} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    <i className="fas fa-plus mr-1"></i> Добавить
                  </button>
                </div>
                <div className="space-y-2">
                  {doctors.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{doc.full_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{doc.specialty}</span>
                      </div>
                      <button onClick={() => handleDeleteDoctor(doc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  ))}
                  {doctors.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Нет врачей</p>}
                </div>
              </div>
            )}

            {/* Users */}
            {activeSection === 'users' && (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-bold mb-2">Добавить пользователя</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Логин"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Пароль"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                      {user.role === 'superadmin' && <option value="superadmin">Суперадминистратор</option>}
                    </select>
                    <button onClick={handleAddUser} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      <i className="fas fa-plus mr-1"></i> Создать
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{u.username}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          u.role === 'superadmin' ? 'bg-red-100 text-red-700' :
                          u.role === 'admin' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{u.role}</span>
                      </div>
                      {u.id !== user.id && (
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password */}
            {activeSection === 'password' && (
              <div className="max-w-md">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Текущий пароль</label>
                    <input
                      type="password"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Новый пароль</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Подтверждение пароля</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <button onClick={handleChangePassword} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    <i className="fas fa-save mr-1"></i> Сменить пароль
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
