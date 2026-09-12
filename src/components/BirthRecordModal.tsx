import React, { useState, useEffect } from 'react';
import { BirthRecord, ChildRecord, Department, Doctor, User, ROBSON_GROUPS, ROBSON_GROUP_LABELS } from '../types';
import { createBirthRecord, updateBirthRecord, getDepartments, getDoctors, getChildren } from '../services/api';
import ChildrenTab from './ChildrenTab';

interface BirthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BirthRecord | null;
  user: User;
  onSave: () => void;
  isNew?: boolean;
}

const emptyRecord: Partial<BirthRecord> = {
  medical_record_number: '',
  admission_date: '',
  admission_time: '',
  admission_department_id: null,
  delivery_date: '',
  delivery_time: '',
  discharge_date: '',
  robson_code: '1',
  is_cesarean: false,
  vaginal_delivery_method: '',
  gestational_age_weeks: 40,
  attending_doctor_id: null,
  pathology_doctor_id: null,
  has_uterine_scar: false,
  previous_cesarean_count: 0,
  presenting_part: '',
  clinical_diagnosis: '',
  is_contracted: false,
  first_stage_duration: '',
  second_stage_duration: '',
  waterless_period_duration: '',
  preinduction_method: '',
  induction_method: '',
};

const BirthRecordModal: React.FC<BirthRecordModalProps> = ({ isOpen, onClose, record, user, onSave, isNew }) => {
  const [formData, setFormData] = useState<Partial<BirthRecord>>(emptyRecord);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'children'>('main');
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (record && !isNew) {
        setFormData(record);
        loadChildren(record.id!);
      } else {
        setFormData({ ...emptyRecord, organization_id: user.organization_id || undefined });
        setChildren([]);
      }
      loadReferences();
    }
  }, [isOpen, record, isNew, user.organization_id]);

  const loadReferences = async () => {
    if (user.organization_id) {
      try {
        const [depts, docs] = await Promise.all([
          getDepartments(user.organization_id),
          getDoctors(user.organization_id),
        ]);
        setDepartments(depts);
        setDoctors(docs);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loadChildren = async (birthRecordId: number) => {
    try {
      const data = await getChildren(birthRecordId);
      setChildren(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field: keyof BirthRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew || !formData.id) {
        await createBirthRecord(formData);
      } else {
        await updateBirthRecord(formData.id, formData);
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Ошибка при сохранении');
      console.error(err);
    } finally {
      setSaving(false);
    }
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
              activeTab === 'main'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-file-medical mr-2"></i>
            Основные данные
          </button>
          <button
            onClick={() => setActiveTab('children')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'children'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-baby mr-2"></i>
            Дети ({children.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'main' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">№ истории родов *</label>
                <input
                  type="text"
                  value={formData.medical_record_number || ''}
                  onChange={(e) => handleChange('medical_record_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Группа по Робсону *</label>
                <select
                  value={formData.robson_code || '1'}
                  onChange={(e) => handleChange('robson_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {ROBSON_GROUPS.map((g) => (
                    <option key={g} value={g}>{g} — {ROBSON_GROUP_LABELS[g]}</option>
                  ))}
                </select>
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Дата поступления</label>
                <input
                  type="date"
                  value={formData.admission_date || ''}
                  onChange={(e) => handleChange('admission_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Время поступления</label>
                <input
                  type="time"
                  value={formData.admission_time || ''}
                  onChange={(e) => handleChange('admission_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 3 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Отделение поступления</label>
                <select
                  value={formData.admission_department_id || ''}
                  onChange={(e) => handleChange('admission_department_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Дата родов</label>
                <input
                  type="date"
                  value={formData.delivery_date || ''}
                  onChange={(e) => handleChange('delivery_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 4 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Время родов</label>
                <input
                  type="time"
                  value={formData.delivery_time || ''}
                  onChange={(e) => handleChange('delivery_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Дата выписки</label>
                <input
                  type="date"
                  value={formData.discharge_date || ''}
                  onChange={(e) => handleChange('discharge_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 5 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Метод родоразрешения</label>
                <select
                  value={formData.is_cesarean ? 'cesarean' : (formData.vaginal_delivery_method || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'cesarean') {
                      handleChange('is_cesarean', true);
                      handleChange('vaginal_delivery_method', '');
                    } else {
                      handleChange('is_cesarean', false);
                      handleChange('vaginal_delivery_method', val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">—</option>
                  <option value="cesarean">Кесарево сечение</option>
                  <option value="spontaneous">Самопроизвольные роды</option>
                  <option value="vacuum">Вакуум-экстракция</option>
                  <option value="forceps">Акушерские щипцы</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Срок беременности (недели)</label>
                <input
                  type="number"
                  min="22"
                  max="43"
                  value={formData.gestational_age_weeks || 40}
                  onChange={(e) => handleChange('gestational_age_weeks', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 6 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Врач, ведущий роды</label>
                <select
                  value={formData.attending_doctor_id || ''}
                  onChange={(e) => handleChange('attending_doctor_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">—</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Врач отд. патологии беременности</label>
                <select
                  value={formData.pathology_doctor_id || ''}
                  onChange={(e) => handleChange('pathology_doctor_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">—</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Row 7 - Checkboxes */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_uterine_scar || false}
                    onChange={(e) => handleChange('has_uterine_scar', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Рубец на матке</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_contracted || false}
                    onChange={(e) => handleChange('is_contracted', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Контрактные роды</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">К-во предшествующих КС</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.previous_cesarean_count || 0}
                  onChange={(e) => handleChange('previous_cesarean_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 8 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Предлежащая часть</label>
                <input
                  type="text"
                  value={formData.presenting_part || ''}
                  onChange={(e) => handleChange('presenting_part', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Головное, тазовое..."
                />
              </div>

              {/* Row 9 - Durations */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">1-й период родов</label>
                <input
                  type="text"
                  value={formData.first_stage_duration || ''}
                  onChange={(e) => handleChange('first_stage_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="чч:мм"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">2-й период родов</label>
                <input
                  type="text"
                  value={formData.second_stage_duration || ''}
                  onChange={(e) => handleChange('second_stage_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="чч:мм"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Безводный период</label>
                <input
                  type="text"
                  value={formData.waterless_period_duration || ''}
                  onChange={(e) => handleChange('waterless_period_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="чч:мм"
                />
              </div>

              {/* Row 10 - Induction */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Метод преиндукции</label>
                <select
                  value={formData.preinduction_method || ''}
                  onChange={(e) => handleChange('preinduction_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">—</option>
                  <option value="mifepristone">Мифепристон</option>
                  <option value="folley">Катетер Фолея</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Метод индукции</label>
                <select
                  value={formData.induction_method || ''}
                  onChange={(e) => handleChange('induction_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">—</option>
                  <option value="mifepristone">Мифепристон</option>
                  <option value="folley">Катетер Фолея</option>
                  <option value="amniotomy">Амниотомия</option>
                  <option value="oxytocin">Окситоцин</option>
                </select>
              </div>

              {/* Full width - Diagnosis */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Клинический диагноз</label>
                <textarea
                  value={formData.clinical_diagnosis || ''}
                  onChange={(e) => handleChange('clinical_diagnosis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Полный текст клинического диагноза..."
                />
              </div>
            </div>
          )}

          {activeTab === 'children' && (
            <ChildrenTab
              children={children}
              birthRecordId={formData.id || 0}
              departments={departments}
              onChildrenChange={setChildren}
              isNew={!formData.id}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default BirthRecordModal;
