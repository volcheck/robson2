import React, { useEffect, useState, useCallback } from 'react';
import { BirthRecord, Department, Doctor, User, ROBSON_GROUPS, ROBSON_GROUP_LABELS } from '../types';
import { getBirthRecords, deleteBirthRecord, getDepartments, getDoctors } from '../services/api';

interface BirthRecordsTableProps {
  user: User;
  onEdit: (record: BirthRecord) => void;
  onAdd: () => void;
  onPrint: (record: BirthRecord) => void;
  refreshKey: number;
}

const BirthRecordsTable: React.FC<BirthRecordsTableProps> = ({ user, onEdit, onAdd, onPrint, refreshKey }) => {
  const [records, setRecords] = useState<BirthRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRobson, setFilterRobson] = useState<string>('');
  const [filterCesarean, setFilterCesarean] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterRobson) filters.robson_code = filterRobson;
      if (filterCesarean) filters.is_cesarean = filterCesarean;

      const [recordsData, deptsData, docsData] = await Promise.all([
        getBirthRecords(user.organization_id || undefined, filters),
        getDepartments(user.organization_id || 0),
        getDoctors(user.organization_id || 0),
      ]);
      setRecords(recordsData);
      setDepartments(deptsData);
      setDoctors(docsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user.organization_id, searchTerm, filterRobson, filterCesarean]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      await deleteBirthRecord(id);
      loadData();
    } catch (err) {
      alert('Ошибка при удалении записи');
    }
  };

  const getDepartmentName = (id: number | null) => {
    if (!id) return '—';
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : '—';
  };

  const getDoctorName = (id: number | null) => {
    if (!id) return '—';
    const doc = doctors.find((d) => d.id === id);
    return doc ? doc.full_name : '—';
  };

  const getDeliveryMethodLabel = (record: BirthRecord) => {
    if (record.is_cesarean) return 'Кесарево сечение';
    switch (record.vaginal_delivery_method) {
      case 'spontaneous': return 'Самопроизвольные роды';
      case 'vacuum': return 'Вакуум-экстракция';
      case 'forceps': return 'Акушерские щипцы';
      default: return '—';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onAdd}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Добавить запись
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i className="fas fa-search text-sm"></i>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              value={filterCesarean}
              onChange={(e) => setFilterCesarean(e.target.value)}
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
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Загрузка данных...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  <i className="fas fa-inbox mr-2"></i>
                  Записи не найдены
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onEdit(record)}
                >
                  <td className="px-3 py-3 font-medium text-indigo-600">{record.medical_record_number}</td>
                  <td className="px-3 py-3">{record.delivery_date}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.is_cesarean ? 'bg-red-100 text-red-700' :
                      record.vaginal_delivery_method === 'vacuum' ? 'bg-yellow-100 text-yellow-700' :
                      record.vaginal_delivery_method === 'forceps' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {getDeliveryMethodLabel(record)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {record.robson_code}
                    </span>
                  </td>
                  <td className="px-3 py-3">{record.gestational_age_weeks}</td>
                  <td className="px-3 py-3 text-gray-600">{getDepartmentName(record.admission_department_id)}</td>
                  <td className="px-3 py-3 text-gray-600">{getDoctorName(record.attending_doctor_id)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(record)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Редактировать"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button
                        onClick={() => onPrint(record)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Печать"
                      >
                        <i className="fas fa-print text-xs"></i>
                      </button>
                      <button
                        onClick={() => record.id && handleDelete(record.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Удалить"
                      >
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        Всего записей: <strong>{records.length}</strong>
      </div>
    </div>
  );
};

export default BirthRecordsTable;
