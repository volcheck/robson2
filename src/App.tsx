import React, { useState, useEffect, useCallback } from 'react';
import { BirthRecord, User, Department, Doctor, DashboardData } from './types';
import { getCurrentUser, logout } from './services/api';
import {
  demoLogin, demoBirthRecords, demoDashboardData,
  demoDepartments, demoDoctors
} from './services/demoData';
import { ROBSON_GROUPS, ROBSON_GROUP_LABELS } from './types';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import BirthRecordsTable from './components/BirthRecordsTable';
import BirthRecordModal from './components/BirthRecordModal';
import PrintView from './components/PrintView';
import AdminPanel from './components/AdminPanel';

// Demo mode flag - when true, uses local data instead of API
const DEMO_MODE = true;

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BirthRecord | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [printRecord, setPrintRecord] = useState<BirthRecord | null>(null);
  const [records, setRecords] = useState<BirthRecord[]>(demoBirthRecords);
  const [dashboardData, setDashboardData] = useState<DashboardData>(demoDashboardData);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setIsNewRecord(true);
    setShowModal(true);
  };

  const handleEdit = (record: BirthRecord) => {
    setEditingRecord(record);
    setIsNewRecord(false);
    setShowModal(true);
  };

  const handlePrint = (record: BirthRecord) => {
    setPrintRecord(record);
  };

  const handleSave = useCallback((newRecord?: BirthRecord) => {
    if (DEMO_MODE && newRecord) {
      if (isNewRecord) {
        const id = Math.max(...records.map(r => r.id || 0)) + 1;
        setRecords(prev => [...prev, { ...newRecord, id, children: newRecord.children || [] }]);
      } else {
        setRecords(prev => prev.map(r => r.id === newRecord.id ? newRecord : r));
      }
      setRefreshKey(k => k + 1);
    }
  }, [isNewRecord, records]);

  const handleDelete = (id: number) => {
    if (window.confirm('Удалить запись?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (printRecord) {
    return (
      <PrintView
        record={printRecord}
        departments={demoDepartments}
        doctors={demoDoctors}
        onClose={() => setPrintRecord(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-baby text-white"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Классификация Робсона</h1>
              <p className="text-xs text-gray-500">
                {user.organization_name || 'Организация'} • {user.username}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  user.role === 'superadmin' ? 'bg-red-100 text-red-700' :
                  user.role === 'admin' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Админ' : 'Пользователь'}</span>
                {DEMO_MODE && <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs">DEMO</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(user.role === 'admin' || user.role === 'superadmin') && (
              <button
                onClick={() => setShowAdmin(true)}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <i className="fas fa-cog"></i>
                <span className="hidden md:inline">Настройки</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden md:inline">Выход</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard */}
        <DashboardCards data={dashboardData} />

        {/* Records table */}
        <DemoTable
          records={records}
          departments={demoDepartments}
          doctors={demoDoctors}
          onEdit={handleEdit}
          onAdd={handleAdd}
          onPrint={handlePrint}
          onDelete={handleDelete}
        />
      </main>

      {/* Modals */}
      {showModal && (
        <DemoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          record={editingRecord}
          isNew={isNewRecord}
          departments={demoDepartments}
          doctors={demoDoctors}
          onSave={handleSave}
        />
      )}

      {showAdmin && (
        <AdminPanel
          user={user}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

// Dashboard Cards component (inline for demo)
function DashboardCards({ data }: { data: DashboardData }) {
  const cards = [
    {
      title: 'Роды за прошедшие сутки',
      subtitle: 'с 8:00 позавчера до 8:00 вчера',
      total: data.yesterday.total,
      cesarean: data.yesterday.cesarean,
      vacuum: data.yesterday.vacuum,
      icon: 'fa-clock',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Роды за неделю',
      subtitle: 'с понедельника текущей недели',
      total: data.week.total,
      cesarean: data.week.cesarean,
      vacuum: data.week.vacuum,
      icon: 'fa-calendar-week',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Роды с начала месяца',
      subtitle: 'с 1-го числа текущего месяца',
      total: data.month.total,
      cesarean: data.month.cesarean,
      vacuum: data.month.vacuum,
      icon: 'fa-calendar-alt',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`bg-gradient-to-r ${card.color} px-4 py-3`}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm">{card.title}</h3>
              <i className={`fas ${card.icon} text-white/70`}></i>
            </div>
            <p className="text-white/70 text-xs mt-1">{card.subtitle}</p>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-800">{card.total}</p>
                <p className="text-sm text-gray-500">всего родов</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="text-gray-600">КС: <strong>{card.cesarean}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="text-gray-600">Вакуум: <strong>{card.vacuum}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Demo table component
function DemoTable({ records, departments, doctors, onEdit, onAdd, onPrint, onDelete }: {
  records: BirthRecord[];
  departments: Department[];
  doctors: Doctor[];
  onEdit: (r: BirthRecord) => void;
  onAdd: () => void;
  onPrint: (r: BirthRecord) => void;
  onDelete: (id: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [filterRobson, setFilterRobson] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const filtered = records.filter(r => {
    if (search && !r.medical_record_number.includes(search)) return false;
    if (filterRobson && r.robson_code !== filterRobson) return false;
    if (filterMethod === '1' && !r.is_cesarean) return false;
    if (filterMethod === '0' && r.is_cesarean) return false;
    return true;
  });

  const getDeptName = (id: number | null) => {
    if (!id) return '—';
    return departments.find(d => d.id === id)?.name || '—';
  };

  const getDocName = (id: number | null) => {
    if (!id) return '—';
    return doctors.find(d => d.id === id)?.full_name || '—';
  };

  const getMethodLabel = (r: BirthRecord) => {
    if (r.is_cesarean) return 'Кесарево сечение';
    switch (r.vaginal_delivery_method) {
      case 'spontaneous': return 'Самопроизвольные роды';
      case 'vacuum': return 'Вакуум-экстракция';
      case 'forceps': return 'Акушерские щипцы';
      default: return '—';
    }
  };

  const getMethodBadge = (r: BirthRecord) => {
    if (r.is_cesarean) return 'bg-red-100 text-red-700';
    if (r.vaginal_delivery_method === 'vacuum') return 'bg-yellow-100 text-yellow-700';
    if (r.vaginal_delivery_method === 'forceps') return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <button
            onClick={onAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Добавить запись
          </button>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i className="fas fa-search text-sm"></i>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по № истории..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filterRobson}
              onChange={(e) => setFilterRobson(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все группы Робсона</option>
              {ROBSON_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все методы</option>
              <option value="1">Кесарево сечение</option>
              <option value="0">Естественные роды</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-3 py-3 text-left font-medium">№ истории</th>
              <th className="px-3 py-3 text-left font-medium">Дата родов</th>
              <th className="px-3 py-3 text-left font-medium">Метод</th>
              <th className="px-3 py-3 text-left font-medium">Группа Робсона</th>
              <th className="px-3 py-3 text-left font-medium">Срок (нед.)</th>
              <th className="px-3 py-3 text-left font-medium">Отделение</th>
              <th className="px-3 py-3 text-left font-medium">Врач</th>
              <th className="px-3 py-3 text-center font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  <i className="fas fa-inbox mr-2"></i>
                  Записи не найдены
                </td>
              </tr>
            ) : (
              filtered.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onEdit(record)}
                >
                  <td className="px-3 py-3 font-medium text-indigo-600">{record.medical_record_number}</td>
                  <td className="px-3 py-3">{record.delivery_date}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getMethodBadge(record)}`}>
                      {getMethodLabel(record)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {record.robson_code}
                    </span>
                  </td>
                  <td className="px-3 py-3">{record.gestational_age_weeks}</td>
                  <td className="px-3 py-3 text-gray-600">{getDeptName(record.admission_department_id)}</td>
                  <td className="px-3 py-3 text-gray-600">{getDocName(record.attending_doctor_id)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onEdit(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Редактировать">
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button onClick={() => onPrint(record)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Печать">
                        <i className="fas fa-print text-xs"></i>
                      </button>
                      <button onClick={() => record.id && onDelete(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Удалить">
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        Всего записей: <strong>{filtered.length}</strong>
      </div>
    </div>
  );
}

// Demo modal component
function DemoModal({ isOpen, onClose, record, isNew, departments, doctors, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  record: BirthRecord | null;
  isNew: boolean;
  departments: Department[];
  doctors: Doctor[];
  onSave: (record: BirthRecord) => void;
}) {
  const [formData, setFormData] = useState<Partial<BirthRecord>>(record || {});
  const [activeTab, setActiveTab] = useState<'main' | 'children'>('main');

  useEffect(() => {
    if (record) {
      setFormData(record);
    } else {
      setFormData({
        medical_record_number: '',
        robson_code: '1',
        is_cesarean: false,
        vaginal_delivery_method: '',
        gestational_age_weeks: 40,
        has_uterine_scar: false,
        previous_cesarean_count: 0,
        is_contracted: false,
        presenting_part: '',
        clinical_diagnosis: '',
        children: [],
      });
    }
  }, [record, isNew]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData as BirthRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            {isNew ? 'Новая запись о родах' : `Запись № ${formData.medical_record_number}`}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'main' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-file-medical mr-2"></i>Основные данные
          </button>
          <button
            onClick={() => setActiveTab('children')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'children' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-baby mr-2"></i>Дети ({formData.children?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'main' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">№ истории родов *</label>
                <input type="text" value={formData.medical_record_number || ''} onChange={(e) => handleChange('medical_record_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Группа по Робсону *</label>
                <select value={formData.robson_code || '1'} onChange={(e) => handleChange('robson_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  {ROBSON_GROUPS.map((g) => (
                    <option key={g} value={g}>{g} — {ROBSON_GROUP_LABELS[g]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Дата поступления</label>
                <input type="date" value={formData.admission_date || ''} onChange={(e) => handleChange('admission_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Время поступления</label>
                <input type="time" value={formData.admission_time || ''} onChange={(e) => handleChange('admission_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Отделение поступления</label>
                <select value={formData.admission_department_id || ''} onChange={(e) => handleChange('admission_department_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">—</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Дата родов</label>
                <input type="date" value={formData.delivery_date || ''} onChange={(e) => handleChange('delivery_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Время родов</label>
                <input type="time" value={formData.delivery_time || ''} onChange={(e) => handleChange('delivery_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Дата выписки</label>
                <input type="date" value={formData.discharge_date || ''} onChange={(e) => handleChange('discharge_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Метод родоразрешения</label>
                <select value={formData.is_cesarean ? 'cesarean' : (formData.vaginal_delivery_method || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'cesarean') { handleChange('is_cesarean', true); handleChange('vaginal_delivery_method', ''); }
                    else { handleChange('is_cesarean', false); handleChange('vaginal_delivery_method', val); }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">—</option>
                  <option value="cesarean">Кесарево сечение</option>
                  <option value="spontaneous">Самопроизвольные роды</option>
                  <option value="vacuum">Вакуум-экстракция</option>
                  <option value="forceps">Акушерские щипцы</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Срок беременности (недели)</label>
                <input type="number" min="22" max="43" value={formData.gestational_age_weeks || 40} onChange={(e) => handleChange('gestational_age_weeks', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Врач, ведущий роды</label>
                <select value={formData.attending_doctor_id || ''} onChange={(e) => handleChange('attending_doctor_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">—</option>
                  {doctors.map((d) => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Врач отд. патологии беременности</label>
                <select value={formData.pathology_doctor_id || ''} onChange={(e) => handleChange('pathology_doctor_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">—</option>
                  {doctors.map((d) => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.has_uterine_scar || false} onChange={(e) => handleChange('has_uterine_scar', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Рубец на матке</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_contracted || false} onChange={(e) => handleChange('is_contracted', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Контрактные роды</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">К-во предшествующих КС</label>
                <input type="number" min="0" max="5" value={formData.previous_cesarean_count || 0} onChange={(e) => handleChange('previous_cesarean_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Предлежащая часть</label>
                <input type="text" value={formData.presenting_part || ''} onChange={(e) => handleChange('presenting_part', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Головное, тазовое..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">1-й период родов</label>
                <input type="text" value={formData.first_stage_duration || ''} onChange={(e) => handleChange('first_stage_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="чч:мм" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">2-й период родов</label>
                <input type="text" value={formData.second_stage_duration || ''} onChange={(e) => handleChange('second_stage_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="чч:мм" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Безводный период</label>
                <input type="text" value={formData.waterless_period_duration || ''} onChange={(e) => handleChange('waterless_period_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" placeholder="чч:мм" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Метод преиндукции</label>
                <select value={formData.preinduction_method || ''} onChange={(e) => handleChange('preinduction_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">—</option>
                  <option value="mifepristone">Мифепристон</option>
                  <option value="folley">Катетер Фолея</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Метод индукции</label>
                <select value={formData.induction_method || ''} onChange={(e) => handleChange('induction_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="">—</option>
                  <option value="mifepristone">Мифепристон</option>
                  <option value="folley">Катетер Фолея</option>
                  <option value="amniotomy">Амниотомия</option>
                  <option value="oxytocin">Окситоцин</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Клинический диагноз</label>
                <textarea value={formData.clinical_diagnosis || ''} onChange={(e) => handleChange('clinical_diagnosis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" rows={3}
                  placeholder="Полный текст клинического диагноза..." />
              </div>
            </div>
          )}

          {activeTab === 'children' && (
            <div>
              <div className="text-center py-4 text-gray-500 text-sm">
                <i className="fas fa-baby text-2xl mb-2 block"></i>
                <p>Данные о детях: {formData.children?.length || 0} записей</p>
                <p className="text-xs mt-1">(В демо-режиме редактирование детей ограничено)</p>
              </div>
              {formData.children && formData.children.length > 0 && (
                <div className="space-y-2">
                  {formData.children.map((child, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">Ребёнок #{child.order_number}</span>
                        <span className="text-xs text-gray-500">Апгар: {child.apgar_score}</span>
                        <span className="text-xs text-gray-500">{child.blood_type} {child.rh_factor}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          child.condition_at_birth === 'satisfactory' ? 'bg-green-100 text-green-700' :
                          child.condition_at_birth === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {child.condition_at_birth === 'satisfactory' ? 'Удовлетворительное' :
                           child.condition_at_birth === 'moderate' ? 'Средней тяжести' : 'Тяжёлое'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <i className="fas fa-save"></i>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
