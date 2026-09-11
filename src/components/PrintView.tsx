import React from 'react';
import { BirthRecord, Department, Doctor } from '../types';

interface PrintViewProps {
  record: BirthRecord;
  departments: Department[];
  doctors: Doctor[];
  onClose: () => void;
}

const PrintView: React.FC<PrintViewProps> = ({ record, departments, doctors, onClose }) => {
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

  const getDeliveryMethod = () => {
    if (record.is_cesarean) return 'Кесарево сечение';
    switch (record.vaginal_delivery_method) {
      case 'spontaneous': return 'Самопроизвольные роды';
      case 'vacuum': return 'Вакуум-экстракция';
      case 'forceps': return 'Акушерские щипцы';
      default: return '—';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Controls - hidden on print */}
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-bold text-gray-800">Печать карточки</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2"
          >
            <i className="fas fa-print"></i>
            Печать
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto p-8" id="print-content">
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-xl font-bold text-center">КАРТОЧКА РОДОВ</h1>
          <p className="text-center text-sm text-gray-600 mt-1">Классификация Робсона</p>
        </div>

        {/* Main data */}
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50 w-1/3">№ истории родов</td>
              <td className="border border-gray-400 px-3 py-2">{record.medical_record_number}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Дата/время поступления</td>
              <td className="border border-gray-400 px-3 py-2">{record.admission_date} {record.admission_time}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Отделение поступления</td>
              <td className="border border-gray-400 px-3 py-2">{getDepartmentName(record.admission_department_id)}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Дата/время родов</td>
              <td className="border border-gray-400 px-3 py-2">{record.delivery_date} {record.delivery_time}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Дата выписки</td>
              <td className="border border-gray-400 px-3 py-2">{record.discharge_date}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Группа по Робсону</td>
              <td className="border border-gray-400 px-3 py-2 font-bold">{record.robson_code}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Метод родоразрешения</td>
              <td className="border border-gray-400 px-3 py-2">{getDeliveryMethod()}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Срок беременности (нед.)</td>
              <td className="border border-gray-400 px-3 py-2">{record.gestational_age_weeks}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Врач, ведущий роды</td>
              <td className="border border-gray-400 px-3 py-2">{getDoctorName(record.attending_doctor_id)}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Врач отд. патологии беременности</td>
              <td className="border border-gray-400 px-3 py-2">{getDoctorName(record.pathology_doctor_id)}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Рубец на матке</td>
              <td className="border border-gray-400 px-3 py-2">{record.has_uterine_scar ? 'Да' : 'Нет'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Предшествующие КС</td>
              <td className="border border-gray-400 px-3 py-2">{record.previous_cesarean_count}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Предлежащая часть</td>
              <td className="border border-gray-400 px-3 py-2">{record.presenting_part || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Контрактные роды</td>
              <td className="border border-gray-400 px-3 py-2">{record.is_contracted ? 'Да' : 'Нет'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">1-й период родов</td>
              <td className="border border-gray-400 px-3 py-2">{record.first_stage_duration || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">2-й период родов</td>
              <td className="border border-gray-400 px-3 py-2">{record.second_stage_duration || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Безводный период</td>
              <td className="border border-gray-400 px-3 py-2">{record.waterless_period_duration || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Метод преиндукции</td>
              <td className="border border-gray-400 px-3 py-2">{record.preinduction_method || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50">Метод индукции</td>
              <td className="border border-gray-400 px-3 py-2">{record.induction_method || '—'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-3 py-2 font-medium bg-gray-50 align-top">Клинический диагноз</td>
              <td className="border border-gray-400 px-3 py-2">{record.clinical_diagnosis || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Children */}
        {record.children && record.children.length > 0 && (
          <>
            <h3 className="text-base font-bold mb-3 border-b border-gray-400 pb-1">Сведения о ребёнке</h3>
            <table className="w-full border-collapse text-sm mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1.5 text-left text-xs">№</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left text-xs">Дата/время</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left text-xs">Апгар</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left text-xs">Гр.крови/Rh</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left text-xs">Состояние</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left text-xs">Отделение</th>
                </tr>
              </thead>
              <tbody>
                {record.children.map((child, idx) => (
                  <tr key={child.id || idx}>
                    <td className="border border-gray-400 px-2 py-1.5">{child.order_number}</td>
                    <td className="border border-gray-400 px-2 py-1.5">{child.birth_date} {child.birth_time}</td>
                    <td className="border border-gray-400 px-2 py-1.5">{child.apgar_score}</td>
                    <td className="border border-gray-400 px-2 py-1.5">{child.blood_type} {child.rh_factor}</td>
                    <td className="border border-gray-400 px-2 py-1.5">{getConditionLabel(child.condition_at_birth)}</td>
                    <td className="border border-gray-400 px-2 py-1.5">{departments.find((d) => d.id === child.department_id)?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="mt-8 flex justify-between text-sm">
          <div>
            <p>Врач: _________________ / {getDoctorName(record.attending_doctor_id)}</p>
          </div>
          <div>
            <p>Дата печати: {new Date().toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintView;
