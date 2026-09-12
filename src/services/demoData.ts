import { BirthRecord, DashboardData, Department, Doctor, Organization, ChildRecord } from '../types';

// Демо-данные для работы без бэкенда
export const demoOrganizations: Organization[] = [
  { id: 1, name: 'Родильный дом №1', created_at: '2024-01-01' },
  { id: 2, name: 'Городская больница №5', created_at: '2024-01-01' },
];

export const demoDepartments: Department[] = [
  { id: 1, organization_id: 1, name: 'Приёмное отделение' },
  { id: 2, organization_id: 1, name: 'Родовое отделение' },
  { id: 3, organization_id: 1, name: 'Отделение патологии беременности' },
  { id: 4, organization_id: 1, name: 'Послеродовое отделение' },
  { id: 5, organization_id: 1, name: 'Отделение новорождённых' },
];

export const demoDoctors: Doctor[] = [
  { id: 1, organization_id: 1, full_name: 'Иванова А.П.', specialty: 'Акушер-гинеколог' },
  { id: 2, organization_id: 1, full_name: 'Петрова М.С.', specialty: 'Акушер-гинеколог' },
  { id: 3, organization_id: 1, full_name: 'Сидорова Е.В.', specialty: 'Акушер-гинеколог' },
  { id: 4, organization_id: 1, full_name: 'Козлова Н.И.', specialty: 'Неонатолог' },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
const fourDaysAgo = new Date(today); fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
const fiveDaysAgo = new Date(today); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

export const demoBirthRecords: BirthRecord[] = [
  {
    id: 1, organization_id: 1, medical_record_number: '2024-001',
    admission_date: fmt(twoDaysAgo), admission_time: '08:30',
    admission_department_id: 1, delivery_date: fmt(twoDaysAgo), delivery_time: '14:15',
    discharge_date: fmt(today), robson_code: '1', is_cesarean: false,
    vaginal_delivery_method: 'spontaneous', gestational_age_weeks: 39,
    attending_doctor_id: 1, pathology_doctor_id: 3,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное', clinical_diagnosis: 'Беременность 39 нед. Срочные роды. Головное предлежание.',
    is_contracted: false, first_stage_duration: '05:30', second_stage_duration: '00:45',
    waterless_period_duration: '03:00', preinduction_method: '', induction_method: '',
    children: [
      { id: 1, birth_record_id: 1, birth_date: fmt(twoDaysAgo), birth_time: '14:15', order_number: 1, apgar_score: '8/9', blood_type: 'I', rh_factor: '+', weight_grams: 3450, height_cm: 52, diagnosis: 'Здоров', condition_at_birth: 'satisfactory', department_id: 5 }
    ]
  },
  {
    id: 2, organization_id: 1, medical_record_number: '2024-002',
    admission_date: fmt(twoDaysAgo), admission_time: '10:00',
    admission_department_id: 1, delivery_date: fmt(twoDaysAgo), delivery_time: '18:30',
    discharge_date: '', robson_code: '5.2', is_cesarean: true,
    vaginal_delivery_method: '', gestational_age_weeks: 38,
    attending_doctor_id: 2, pathology_doctor_id: null,
    has_uterine_scar: true, previous_cesarean_count: 1,
    presenting_part: 'Головное', clinical_diagnosis: 'Беременность 38 нед. Рубец на матке. Плановое КС.',
    is_contracted: false, first_stage_duration: '', second_stage_duration: '',
    waterless_period_duration: '', preinduction_method: '', induction_method: '',
    children: [
      { id: 2, birth_record_id: 2, birth_date: fmt(twoDaysAgo), birth_time: '18:30', order_number: 1, apgar_score: '7/8', blood_type: 'II', rh_factor: '+', weight_grams: 3200, height_cm: 50, diagnosis: '', condition_at_birth: 'satisfactory', department_id: 5 }
    ]
  },
  {
    id: 3, organization_id: 1, medical_record_number: '2024-003',
    admission_date: fmt(yesterday), admission_time: '06:15',
    admission_department_id: 2, delivery_date: fmt(yesterday), delivery_time: '09:45',
    discharge_date: '', robson_code: '3', is_cesarean: false,
    vaginal_delivery_method: 'spontaneous', gestational_age_weeks: 40,
    attending_doctor_id: 1, pathology_doctor_id: null,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное', clinical_diagnosis: 'Беременность 40 нед. Повторные срочные роды.',
    is_contracted: false, first_stage_duration: '03:15', second_stage_duration: '00:15',
    waterless_period_duration: '01:30', preinduction_method: '', induction_method: '',
    children: [
      { id: 3, birth_record_id: 3, birth_date: fmt(yesterday), birth_time: '09:45', order_number: 1, apgar_score: '9/10', blood_type: 'III', rh_factor: '-', weight_grams: 3600, height_cm: 53, diagnosis: '', condition_at_birth: 'satisfactory', department_id: 5 }
    ]
  },
  {
    id: 4, organization_id: 1, medical_record_number: '2024-004',
    admission_date: fmt(yesterday), admission_time: '14:00',
    admission_department_id: 1, delivery_date: fmt(yesterday), delivery_time: '22:10',
    discharge_date: '', robson_code: '2b', is_cesarean: true,
    vaginal_delivery_method: '', gestational_age_weeks: 39,
    attending_doctor_id: 3, pathology_doctor_id: 3,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное', clinical_diagnosis: 'Беременность 39 нед. Первородящая. Слабость родовой деятельности. Экстренное КС.',
    is_contracted: false, first_stage_duration: '07:30', second_stage_duration: '',
    waterless_period_duration: '05:00', preinduction_method: '', induction_method: 'oxytocin',
    children: [
      { id: 4, birth_record_id: 4, birth_date: fmt(yesterday), birth_time: '22:10', order_number: 1, apgar_score: '7/8', blood_type: 'I', rh_factor: '+', weight_grams: 3100, height_cm: 49, diagnosis: 'Транзиторное тахипноэ новорождённых', condition_at_birth: 'moderate', department_id: 5 }
    ]
  },
  {
    id: 5, organization_id: 1, medical_record_number: '2024-005',
    admission_date: fmt(threeDaysAgo), admission_time: '11:00',
    admission_department_id: 3, delivery_date: fmt(yesterday), delivery_time: '03:20',
    discharge_date: '', robson_code: '8', is_cesarean: false,
    vaginal_delivery_method: 'spontaneous', gestational_age_weeks: 36,
    attending_doctor_id: 2, pathology_doctor_id: 3,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное/Тазовое', clinical_diagnosis: 'Беременность 36 нед. Двойня. Роды через естественные родовые пути.',
    is_contracted: false, first_stage_duration: '15:00', second_stage_duration: '00:40',
    waterless_period_duration: '02:00', preinduction_method: '', induction_method: 'amniotomy',
    children: [
      { id: 5, birth_record_id: 5, birth_date: fmt(yesterday), birth_time: '03:20', order_number: 1, apgar_score: '8/9', blood_type: 'II', rh_factor: '+', weight_grams: 2400, height_cm: 47, diagnosis: '', condition_at_birth: 'satisfactory', department_id: 5 },
      { id: 6, birth_record_id: 5, birth_date: fmt(yesterday), birth_time: '03:35', order_number: 2, apgar_score: '7/8', blood_type: 'II', rh_factor: '+', weight_grams: 2250, height_cm: 46, diagnosis: '', condition_at_birth: 'satisfactory', department_id: 5 }
    ]
  },
  {
    id: 6, organization_id: 1, medical_record_number: '2024-006',
    admission_date: fmt(fourDaysAgo), admission_time: '09:30',
    admission_department_id: 1, delivery_date: fmt(fourDaysAgo), delivery_time: '16:00',
    discharge_date: fmt(yesterday), robson_code: '4b', is_cesarean: false,
    vaginal_delivery_method: 'vacuum', gestational_age_weeks: 40,
    attending_doctor_id: 1, pathology_doctor_id: null,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное', clinical_diagnosis: 'Беременность 40 нед. Повторнородящая. Вторичная слабость потуг. Вакуум-экстракция.',
    is_contracted: false, first_stage_duration: '06:00', second_stage_duration: '01:30',
    waterless_period_duration: '04:00', preinduction_method: '', induction_method: '',
    children: [
      { id: 7, birth_record_id: 6, birth_date: fmt(fourDaysAgo), birth_time: '16:00', order_number: 1, apgar_score: '6/8', blood_type: 'IV', rh_factor: '-', weight_grams: 3350, height_cm: 51, diagnosis: 'Ретинопатия недоношенных - нет', condition_at_birth: 'moderate', department_id: 5 }
    ]
  },
  {
    id: 7, organization_id: 1, medical_record_number: '2024-007',
    admission_date: fmt(fiveDaysAgo), admission_time: '22:00',
    admission_department_id: 2, delivery_date: fmt(fiveDaysAgo), delivery_time: '23:45',
    discharge_date: fmt(twoDaysAgo), robson_code: '10', is_cesarean: false,
    vaginal_delivery_method: 'spontaneous', gestational_age_weeks: 34,
    attending_doctor_id: 3, pathology_doctor_id: 3,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное', clinical_diagnosis: 'Преждевременные роды 34 нед. Головное предлежание.',
    is_contracted: false, first_stage_duration: '01:30', second_stage_duration: '00:15',
    waterless_period_duration: '00:30', preinduction_method: '', induction_method: '',
    children: [
      { id: 8, birth_record_id: 7, birth_date: fmt(fiveDaysAgo), birth_time: '23:45', order_number: 1, apgar_score: '6/7', blood_type: 'I', rh_factor: '+', weight_grams: 2100, height_cm: 44, diagnosis: 'Недоношенность 34 нед. ДРН.', condition_at_birth: 'moderate', department_id: 5 }
    ]
  },
  {
    id: 8, organization_id: 1, medical_record_number: '2024-008',
    admission_date: fmt(today), admission_time: '07:00',
    admission_department_id: 1, delivery_date: fmt(today), delivery_time: '11:30',
    discharge_date: '', robson_code: '1', is_cesarean: false,
    vaginal_delivery_method: 'spontaneous', gestational_age_weeks: 40,
    attending_doctor_id: 2, pathology_doctor_id: null,
    has_uterine_scar: false, previous_cesarean_count: 0,
    presenting_part: 'Головное', clinical_diagnosis: 'Беременность 40 нед. Срочные роды первородящей.',
    is_contracted: false, first_stage_duration: '04:00', second_stage_duration: '00:30',
    waterless_period_duration: '02:00', preinduction_method: '', induction_method: '',
    children: [
      { id: 9, birth_record_id: 8, birth_date: fmt(today), birth_time: '11:30', order_number: 1, apgar_score: '9/10', blood_type: 'III', rh_factor: '+', weight_grams: 3500, height_cm: 52, diagnosis: '', condition_at_birth: 'satisfactory', department_id: 5 }
    ]
  },
];

export const demoDashboardData: DashboardData = {
  yesterday: { total: 3, cesarean: 1, vacuum: 0 },
  week: { total: 8, cesarean: 2, vacuum: 1 },
  month: { total: 8, cesarean: 2, vacuum: 1 },
};

// Demo auth
export const demoLogin = (username: string, password: string) => {
  if (username === 'admin' && password === 'admin123') {
    return {
      token: 'demo-token-123',
      user: {
        id: 1,
        username: 'admin',
        role: 'superadmin' as const,
        organization_id: null,
        organization_name: undefined,
      }
    };
  }
  if (username === 'owner' && password === 'owner123') {
    return {
      token: 'demo-token-456',
      user: {
        id: 2,
        username: 'owner',
        role: 'owner' as const,
        organization_id: 1,
        organization_name: 'Родильный дом №1',
      }
    };
  }
  if (username === 'observer' && password === 'observer123') {
    return {
      token: 'demo-token-789',
      user: {
        id: 3,
        username: 'observer',
        role: 'observer' as const,
        organization_id: 1,
        organization_name: 'Родильный дом №1',
      }
    };
  }
  throw new Error('Неверный логин или пароль');
};
