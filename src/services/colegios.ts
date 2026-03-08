import { supabase } from './supabase';
import { Colegio, UsuarioColegio, UserWithColegios } from '@/types/colegio';

interface UsuarioColegioQuery {
  colegio_id: string;
  role: string;
  assigned_at: string;
  colegios: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
}

export async function getColegios(): Promise<Colegio[]> {
  try {
    const { data, error } = await supabase
      .from('colegios')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching colegios:', error);
      throw new Error('Error al cargar los colegios');
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching colegios:', error);
    return []; // Return empty array instead of throwing to prevent crashes
  }
}

export async function getUserColegios(userId: string): Promise<UserWithColegios | null> {
  try {
    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, username, role, status')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return null;
    }

    // Get user's colegios
    const { data: colegiosData, error: colegiosError } = await supabase
      .from('usuario_colegios')
      .select(`
        colegio_id,
        role,
        assigned_at,
        colegios!inner (
          id,
          name,
          code
        )
      `)
      .eq('user_id', userId);

    if (colegiosError) {
      console.error('Error fetching user colegios:', colegiosError);
      throw new Error('Error al cargar los colegios del usuario');
    }

    const userWithColegios: UserWithColegios = {
      ...userData,
      colegios: (colegiosData as UsuarioColegioQuery[] || []).map(uc => ({
        id: uc.colegios.id,
        name: uc.colegios.name,
        code: uc.colegios.code,
        role: uc.role,
        assigned_at: uc.assigned_at
      }))
    };

    return userWithColegios;
  } catch (error) {
    console.error('Unexpected error fetching user colegios:', error);
    throw new Error('Error inesperado al cargar los colegios del usuario');
  }
}

export async function assignColegioToUser(
  userId: string, 
  colegioId: string, 
  role: 'admin' | 'teacher' | 'staff',
  assignedBy: string
): Promise<UsuarioColegio> {
  try {
    const { data, error } = await supabase
      .from('usuario_colegios')
      .insert([{
        user_id: userId,
        colegio_id: colegioId,
        role,
        assigned_by: assignedBy
      }])
      .select()
      .single();

    if (error) {
      console.error('Error assigning colegio to user:', error);
      throw new Error('Error al asignar colegio al usuario');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error assigning colegio to user:', error);
    throw new Error('Error inesperado al asignar colegio al usuario');
  }
}

export async function removeColegioFromUser(userId: string, colegioId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuario_colegios')
      .delete()
      .eq('user_id', userId)
      .eq('colegio_id', colegioId);

    if (error) {
      console.error('Error removing colegio from user:', error);
      throw new Error('Error al remover colegio del usuario');
    }
  } catch (error) {
    console.error('Unexpected error removing colegio from user:', error);
    throw new Error('Error inesperado al remover colegio del usuario');
  }
}

export async function updateUserColegioRole(
  userId: string, 
  colegioId: string, 
  role: 'admin' | 'teacher' | 'staff'
): Promise<UsuarioColegio> {
  try {
    const { data, error } = await supabase
      .from('usuario_colegios')
      .update({ role })
      .eq('user_id', userId)
      .eq('colegio_id', colegioId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user colegio role:', error);
      throw new Error('Error al actualizar rol del usuario en colegio');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating user colegio role:', error);
    throw new Error('Error inesperado al actualizar rol del usuario en colegio');
  }
}

export async function addColegio(colegio: Omit<Colegio, 'id' | 'created_at'>): Promise<Colegio | null> {
  try {
    // Generate a UUID for the new colegio
    const newColegio = {
      ...colegio,
      id: crypto.randomUUID(), // Generate UUID for the id
      created_at: new Date().toISOString() // Set created_at timestamp
    };

    const { data, error } = await supabase
      .from('colegios')
      .insert([newColegio])
      .select()
      .single();

    if (error) {
      console.error('Error adding colegio:', error);
      throw new Error('Error al agregar el colegio');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error adding colegio:', error);
    throw new Error('Error inesperado al agregar el colegio');
  }
}

export async function updateColegio(id: string, updates: Partial<Colegio>): Promise<Colegio | null> {
  try {
    console.log('Updating colegio:', { id, updates });
    
    const { data, error } = await supabase
      .from('colegios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating colegio:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        console.error('Colegio not found or no permission to update:', id);
        throw new Error('Colegio no encontrado o no tienes permisos para actualizarlo');
      }
      
      throw new Error(`Error al actualizar el colegio: ${error.message}`);
    }

    console.log('Colegio updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error updating colegio:', error);
    
    // Don't re-throw if it's already a custom error
    if (error instanceof Error && error.message.includes('Colegio no encontrado')) {
      throw error;
    }
    
    throw new Error('Error inesperado al actualizar el colegio');
  }
}

export async function deleteColegio(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('colegios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting colegio:', error);
      throw new Error('Error al eliminar el colegio');
    }
  } catch (error) {
    console.error('Unexpected error deleting colegio:', error);
    throw new Error('Error inesperado al eliminar el colegio');
  }
}

export async function getActiveColegiosForUser(userId: string): Promise<UserWithColegios | null> {
  try {
    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, username, role, status')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return null;
    }

    // Get user's colegios with status filter
    const { data: colegiosData, error: colegiosError } = await supabase
      .from('usuario_colegios')
      .select(`
        colegio_id,
        role,
        assigned_at,
        colegios!inner(
          id,
          name,
          code,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('colegios.status', 'active')
      .order('assigned_at', { ascending: false });

    if (colegiosError) {
      console.error('Error fetching user colegios:', colegiosError);
      console.warn('User colegios query failed, returning empty array');
    }

    // Transform data to match expected interface
    const transformedColegios = (colegiosData || []).map((item: any) => ({
      id: item.colegio_id,
      name: item.colegios.name,
      code: item.colegios.code,
      role: item.role,
      assigned_at: item.assigned_at,
      status: item.colegios.status
    }));

    const userWithColegios: UserWithColegios = {
      ...userData,
      colegios: transformedColegios
    };

    return userWithColegios;
  } catch (error) {
    console.error('Unexpected error fetching user colegios:', error);
    // Return user with empty colegios instead of throwing to prevent crashes
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, username, role, status')
        .eq('id', userId)
        .single();
      
      if (userData) {
        return {
          ...userData,
          colegios: []
        };
      }
    } catch (userError) {
      console.error('Error fetching user data as fallback:', userError);
    }
    
    throw new Error('Error inesperado al cargar colegios del usuario');
  }
}

export async function hasActiveColegios(userId: string): Promise<boolean> {
  try {
    const userWithColegios = await getActiveColegiosForUser(userId);
    return (userWithColegios?.colegios?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking active colegios:', error);
    return false;
  }
}

export async function canUserLogin(userId: string): Promise<{ canLogin: boolean; reason?: string }> {
  try {
    // Super admins can always login
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userData?.role === 'SUPER_ADMIN') {
      return { canLogin: true };
    }

    // Check if user has active colegios
    const hasActive = await hasActiveColegios(userId);
    
    if (!hasActive) {
      return { 
        canLogin: false, 
        reason: 'No tienes colegios activos asignados. Contacta al administrador.' 
      };
    }

    return { canLogin: true };
  } catch (error) {
    console.error('Error checking if user can login:', error);
    return { 
      canLogin: false, 
      reason: 'Error al verificar colegios activos. Intenta nuevamente.' 
    };
  }
}
