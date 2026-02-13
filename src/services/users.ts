import { supabase, isSupabaseConfigured } from './supabase';
import { User, UserRole } from '@/types/auth';

// Mock users for demo mode
const MOCK_USERS = [
  { id: 'usr-super', name: 'Super Admin', email: 'super@edugrade.com', role: UserRole.SUPER_ADMIN, username: 'Admin' },
  { id: 'usr-admin', name: 'Admin Colegio', email: 'admin@colegio.com', role: UserRole.ADMIN_COLEGIO, username: 'Colegio' },
  { id: 'usr-teacher-1', name: 'Jhon Doe', email: 'jhon.doe@colegio.com', role: UserRole.DOCENTE, username: 'Jhon' },
  { id: 'usr-teacher-2', name: 'Jane Smith', email: 'jane.smith@colegio.com', role: UserRole.DOCENTE, username: 'Jane' },
];

export async function getUsers(): Promise<User[]> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode - return mock users
    return MOCK_USERS;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, username');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return [];
  }
}

export async function addUser(user: Omit<User, 'id'>): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode - not supported
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      console.error('Error adding user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error adding user:', error);
    return null;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode - not supported
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode - not supported
    return false;
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return false;
  }
}
