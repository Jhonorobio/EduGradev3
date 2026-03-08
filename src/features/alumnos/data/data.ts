import { type Alumno } from './schema'

export const statuses = [
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
  {
    value: 'suspended',
    label: 'Suspended',
  },
] as const

// Mock data - en producción esto vendría de la API
export const alumnos: Alumno[] = [
  {
    id: '1',
    name: 'Ana Sofía',
    last_name: 'Martínez Pérez',
    colegio_id: '1',
    colegio_name: 'Colegio San José',
    grade_id: '1',
    grade_name: '1° A',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Carlos Andrés',
    last_name: 'García López',
    colegio_id: '1',
    colegio_name: 'Colegio San José',
    grade_id: '2',
    grade_name: '2° B',
    status: 'active',
    created_at: '2024-01-20T14:15:00Z',
  },
  {
    id: '3',
    name: 'María Fernanda',
    last_name: 'Rodríguez Castro',
    colegio_id: '2',
    colegio_name: 'Colegio María Auxiliadora',
    grade_id: '3',
    grade_name: '3° C',
    status: 'active',
    created_at: '2024-02-01T09:45:00Z',
  },
  {
    id: '4',
    name: 'Luis Miguel',
    last_name: 'Sánchez Torres',
    colegio_id: '3',
    colegio_name: 'Colegio La Salle',
    grade_id: '1',
    grade_name: '1° A',
    status: 'inactive',
    created_at: '2024-02-10T16:20:00Z',
  },
  {
    id: '5',
    name: 'Valentina',
    last_name: 'Gómez Hernández',
    colegio_id: '2',
    colegio_name: 'Colegio María Auxiliadora',
    grade_id: '4',
    grade_name: '4° A',
    status: 'active',
    created_at: '2024-02-15T11:30:00Z',
  },
]
