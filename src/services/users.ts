import { supabase } from './supabase';
import { User, UserRole } from '@/types/auth';

export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, username')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Error al cargar los usuarios');
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    throw new Error('Error inesperado al cargar los usuarios');
  }
}

export async function getTeachers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, username')
      .eq('role', UserRole.DOCENTE);

    if (error) {
      console.error('Error fetching teachers:', error);
      throw new Error('Error al cargar los docentes');
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching teachers:', error);
    throw new Error('Error inesperado al cargar los docentes');
  }
}

export async function addUser(user: Omit<User, 'id'>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      console.error('Error adding user:', error);
      throw new Error('Error al agregar el usuario');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error adding user:', error);
    throw new Error('Error inesperado al agregar el usuario');
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error('Error al actualizar el usuario');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    throw new Error('Error inesperado al actualizar el usuario');
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error al eliminar el usuario');
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    throw new Error('Error inesperado al eliminar el usuario');
  }
}
