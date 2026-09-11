export interface User {
  id: number;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  organization_id: number | null;
  organization_name?: string;
}

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
  robson_code: number;
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
