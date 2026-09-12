export interface User {
  id: number;
  username: string;
  role: 'superadmin' | 'owner' | 'observer';
  organization_id: number | null;
  organization_name?: string;
}

// Права доступа
export const ROLE_PERMISSIONS = {
  superadmin: {
    label: 'Суперадминистратор',
    canCreateOrganizations: true,
    canManageUsers: true, // может назначать владельцев
    canManageDepartments: true, // для любой организации
    canManageDoctors: true, // для любой организации
    canEditRecords: true, // для любой организации
    canViewRecords: true, // для любой организации
    canViewDashboard: true, // для любой организации
  },
  owner: {
    label: 'Владелец организации',
    canCreateOrganizations: false,
    canManageUsers: true, // назначает наблюдателей
    canManageDepartments: true, // своей организации
    canManageDoctors: true, // своей организации
    canEditRecords: true, // своей организации
    canViewRecords: true, // своей организации
    canViewDashboard: true, // своей организации
  },
  observer: {
    label: 'Наблюдатель',
    canCreateOrganizations: false,
    canManageUsers: false,
    canManageDepartments: false,
    canManageDoctors: false,
    canEditRecords: false,
    canViewRecords: true, // только просмотр
    canViewDashboard: true, // только просмотр
  },
} as const;

export type Role = keyof typeof ROLE_PERMISSIONS;

export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export interface Department {
  id: number;
  organization_id: number;
  name: string;
}

export interface Doctor {
  id: number;
  organization_id: number;
  full_name: string;
  specialty: string;
}

export interface ChildRecord {
  id?: number;
  birth_record_id?: number;
  birth_date: string;
  birth_time: string;
  order_number: number;
  apgar_score: string;
  blood_type: string;
  rh_factor: string;
  diagnosis: string;
  condition_at_birth: 'satisfactory' | 'moderate' | 'severe';
  department_id: number | null;
}

// Группы по классификации Робсона
export const ROBSON_GROUPS = [
  '1', '2a', '2b', '3', '4a', '4b', '5.1', '5.2', '6', '7', '8', '9', '10'
] as const;

export type RobsonGroup = typeof ROBSON_GROUPS[number];

export const ROBSON_GROUP_LABELS: Record<string, string> = {
  '1': '1 — Nullipara, singleton, cephalic, ≥37 нед., спонтанные роды',
  '2a': '2a — Nullipara, singleton, cephalic, ≥37 нед., КС до начала родов',
  '2b': '2b — Nullipara, singleton, cephalic, ≥37 нед., КС после начала родов',
  '3': '3 — Multipara (без КС), singleton, cephalic, ≥37 нед., спонтанные роды',
  '4a': '4a — Multipara (без КС), singleton, cephalic, ≥37 нед., КС до начала родов',
  '4b': '4b — Multipara (без КС), singleton, cephalic, ≥37 нед., КС после начала родов',
  '5.1': '5.1 — Предыдущее КС, singleton, cephalic, ≥37 нед., спонтанные роды',
  '5.2': '5.2 — Предыдущее КС, ≥37 нед., КС (до или после начала родов)',
  '6': '6 — Все nulliparae с тазовым предлежанием',
  '7': '7 — Все multiparae с тазовым предлежанием (вкл. с КС в анамнезе)',
  '8': '8 — Все многоплодные беременности',
  '9': '9 — Все с аномалиями предлежания (поперечное, косое)',
  '10': '10 — Все одиночные, cephalic, <37 нед.',
};

export interface BirthRecord {
  id?: number;
  organization_id: number;
  medical_record_number: string;
  admission_date: string;
  admission_time: string;
  admission_department_id: number | null;
  delivery_date: string;
  delivery_time: string;
  discharge_date: string;
  robson_code: string;
  is_cesarean: boolean;
  vaginal_delivery_method: 'spontaneous' | 'vacuum' | 'forceps' | '';
  gestational_age_weeks: number;
  attending_doctor_id: number | null;
  pathology_doctor_id: number | null;
  has_uterine_scar: boolean;
  previous_cesarean_count: number;
  presenting_part: string;
  clinical_diagnosis: string;
  is_contracted: boolean;
  first_stage_duration: string;
  second_stage_duration: string;
  waterless_period_duration: string;
  preinduction_method: string;
  induction_method: string;
  children?: ChildRecord[];
  created_at?: string;
  updated_at?: string;
}

export interface DashboardData {
  yesterday: {
    total: number;
    cesarean: number;
    vacuum: number;
  };
  week: {
    total: number;
    cesarean: number;
    vacuum: number;
  };
  month: {
    total: number;
    cesarean: number;
    vacuum: number;
  };
}

export interface LoginForm {
  username: string;
  password: string;
}
