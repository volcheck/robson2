import React, { useState } from 'react';
import { ChildRecord, Department } from '../types';
import { createChild, updateChild, deleteChild } from '../services/api';

interface ChildrenTabProps {
  children: ChildRecord[];
  birthRecordId: number;
  departments: Department[];
  onChildrenChange: (children: ChildRecord[]) => void;
  isNew: boolean;
}

const emptyChild: Partial<ChildRecord> = {
  birth_date: '',
  birth_time: '',
  order_number: 1,
  apgar_score: '',
  blood_type: '',
  rh_factor: '',
  weight_grams: null,
  height_cm: null,
  diagnosis: '',
  condition_at_birth: 'satisfactory',
  department_id: null,
};

const ChildrenTab: React.FC<ChildrenTabProps> = ({ children, birthRecordId, departments, onChildrenChange, isNew }) => {
  const [editingChild, setEditingChild] = useState<Partial<ChildRecord> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    setEditingChild({ ...emptyChild });
    setIsAdding(true);
  };

  const handleEdit = (child: ChildRecord) => {
    setEditingChild({ ...child });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!editingChild) return;
    setSaving(true);
    try {
      if (isNew) {
        // For new records, just update local state
        if (isAdding) {
          onChildrenChange([...children, { ...editingChild } as ChildRecord]);
        } else {
          onChildrenChange(children.map((c) => (c === children.find((ch) => ch.id === editingChild.id) ? { ...editingChild } as ChildRecord : c)));
        }
      } else if (isAdding) {
        const result = await createChild({ ...editingChild, birth_record_id: birthRecordId });
        onChildrenChange([...children, result]);
      } else {
        await updateChild(editingChild.id!, editingChild);
        onChildrenChange(children.map((c) => (c.id === editingChild.id ? { ...editingChild } as ChildRecord : c)));
      }
      setEditingChild(null);
      setIsAdding(false);
    } catch (err) {
      alert('Ошибка при сохранении');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (childId: number) => {
    if (!window.confirm('Удалить запись о ребёнке?')) return;
    try {
      if (!isNew) {
        await deleteChild(childId);
      }
      onChildrenChange(children.filter((c) => c.id !== childId));
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'satisfactory': return 'Удовлетворительное';
      case 'moderate': return 'Средней степени тяжести';
      case 'severe': return 'Тяжёлое';
      default: return '—';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'satisfactory': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'severe': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      {/* Add button */}
      <div className="mb-4">
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Добавить ребёнка
        </button>
      </div>

      {/* Edit form */}
      {editingChild && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <h4 className="text-sm font-bold text-gray-700 mb-3">
            {isAdding ? 'Новый ребёнок' : 'Редактирование'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата родов</label>
              <input
                type="date"
                value={editingChild.birth_date || ''}
                onChange={(e) => setEditingChild({ ...editingChild, birth_date: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Время родов</label>
              <input
                type="time"
                value={editingChild.birth_time || ''}
                onChange={(e) => setEditingChild({ ...editingChild, birth_time: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Порядковый номер</label>
              <input
                type="number"
                min="1"
                value={editingChild.order_number || 1}
                onChange={(e) => setEditingChild({ ...editingChild, order_number: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Оценка по Апгар (1/5 мин)</label>
              <input
                type="text"
                value={editingChild.apgar_score || ''}
                onChange={(e) => setEditingChild({ ...editingChild, apgar_score: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="8/9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Группа крови</label>
              <select
                value={editingChild.blood_type || ''}
                onChange={(e) => setEditingChild({ ...editingChild, blood_type: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="">—</option>
                <option value="I">I (O)</option>
                <option value="II">II (A)</option>
                <option value="III">III (B)</option>
                <option value="IV">IV (AB)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Резус-фактор</label>
              <select
                value={editingChild.rh_factor || ''}
                onChange={(e) => setEditingChild({ ...editingChild, rh_factor: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="">—</option>
                <option value="+">Rh+</option>
                <option value="-">Rh-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Вес при рождении (г)</label>
              <input
                type="number"
                min="500"
                max="7000"
                step="10"
                value={editingChild.weight_grams ?? ''}
                onChange={(e) => setEditingChild({ ...editingChild, weight_grams: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="3500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Рост при рождении (см)</label>
              <input
                type="number"
                min="25"
                max="65"
                step="0.1"
                value={editingChild.height_cm ?? ''}
                onChange={(e) => setEditingChild({ ...editingChild, height_cm: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="52"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Состояние при рождении</label>
              <select
                value={editingChild.condition_at_birth || 'satisfactory'}
                onChange={(e) => setEditingChild({ ...editingChild, condition_at_birth: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="satisfactory">Удовлетворительное</option>
                <option value="moderate">Средней степени тяжести</option>
                <option value="severe">Тяжёлое</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Отделение</label>
              <select
                value={editingChild.department_id || ''}
                onChange={(e) => setEditingChild({ ...editingChild, department_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Диагноз ребёнка</label>
              <textarea
                value={editingChild.diagnosis || ''}
                onChange={(e) => setEditingChild({ ...editingChild, diagnosis: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-check mr-1"></i>}
              Сохранить
            </button>
            <button
              onClick={() => { setEditingChild(null); setIsAdding(false); }}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Children list */}
      {children.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-baby text-3xl mb-2"></i>
          <p>Нет данных о детях</p>
        </div>
      ) : (
        <div className="space-y-2">
          {children.map((child, index) => (
            <div key={child.id || index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-gray-800">
                      Ребёнок #{child.order_number || index + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(child.condition_at_birth)}`}>
                      {getConditionLabel(child.condition_at_birth)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
                    <span>Дата: {child.birth_date || '—'} {child.birth_time || ''}</span>
                    <span>Апгар: {child.apgar_score || '—'}</span>
                    <span>Группа крови: {child.blood_type || '—'} {child.rh_factor || ''}</span>
                    <span>Вес: {child.weight_grams ? `${child.weight_grams} г` : '—'}</span>
                    <span>Рост: {child.height_cm ? `${child.height_cm} см` : '—'}</span>
                  </div>
                  {child.diagnosis && (
                    <p className="text-xs text-gray-500 mt-1">Диагноз: {child.diagnosis}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(child)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <i className="fas fa-edit text-xs"></i>
                  </button>
                  <button
                    onClick={() => child.id && handleDelete(child.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildrenTab;
