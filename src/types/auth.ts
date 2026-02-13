export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_COLEGIO = 'ADMIN_COLEGIO',
  DOCENTE = 'DOCENTE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  gender?: 'male' | 'female';
  username: string;
  password?: string; // Should only be used for creation/update
}
