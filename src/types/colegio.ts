export interface Colegio {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface UsuarioColegio {
  id: string;
  user_id: string;
  colegio_id: string;
  role: 'admin' | 'teacher' | 'staff';
  assigned_at: string;
  assigned_by: string;
}

export interface UserWithColegios {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  colegios: Array<{
    id: string;
    name: string;
    code: string;
    role: string;
    assigned_at: string;
    status: string;
  }>;
}
