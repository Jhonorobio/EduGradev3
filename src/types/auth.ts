export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_COLEGIO = 'ADMIN_COLEGIO',
  DOCENTE = 'DOCENTE'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface ColegioAsignado {
  id: string;
  name: string;
  code: string;
  role: 'admin' | 'teacher' | 'staff';
  assigned_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  gender?: 'male' | 'female';
  username: string;
  password?: string; // Should only be used for creation/update
  colegios?: ColegioAsignado[]; // Optional: loaded when needed
}
