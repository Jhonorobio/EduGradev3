import { supabase } from './supabase';
import { User, UserStatus } from '@/types/auth';

export async function login(username: string, password: string): Promise<User | null> {
  // First, get user's email from their username, as Supabase Auth uses email.
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !userProfile) {
    console.error('Login failed: could not find user profile for username:', username, profileError);
    return null;
  }

  // Check user status - only active users can log in
  if (userProfile.status !== UserStatus.ACTIVE) {
    console.error('Login failed: user is not active. Status:', userProfile.status);
    throw new Error(getStatusErrorMessage(userProfile.status));
  }

  // First authenticate with Supabase Auth - this is required for RLS policies to work
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userProfile.email,
    password: password,
  });

  if (authError) {
    console.error('Supabase auth error:', authError);
    return null;
  }

  // Now that user is authenticated, we can check their colegios (RLS will work)
  if (userProfile.role !== 'SUPER_ADMIN') {
    try {
      // Consultamos usuario_colegios (ahora con sesión activa, RLS funciona)
      const { data: userColegios, error: colegiosError } = await supabase
        .from('usuario_colegios')
        .select('colegio_id, role')
        .eq('user_id', userProfile.id);

      if (colegiosError) {
        console.error('Error checking user colegios:', colegiosError);
        console.log('User ID:', userProfile.id);
        // Sign out since validation failed
        await supabase.auth.signOut();
        throw new Error('Error al verificar colegios del usuario');
      }

      // Si no tiene asignaciones
      if (!userColegios || userColegios.length === 0) {
        console.error('Login failed: user has no colegios assigned. User ID:', userProfile.id);
        // Sign out since validation failed
        await supabase.auth.signOut();
        throw new Error('No tienes colegios asignados. Contacta al administrador para obtener acceso.');
      }

      // Verificar que al menos un colegio esté activo
      const { data: activeColegios, error: activeError } = await supabase
        .from('colegios')
        .select('id')
        .in('id', userColegios.map(uc => uc.colegio_id))
        .eq('status', 'active');

      if (activeError) {
        console.error('Error checking active colegios:', activeError);
      }

      if (!activeColegios || activeColegios.length === 0) {
        console.error('Login failed: user has colegios assigned but none are active. User ID:', userProfile.id);
        // Sign out since validation failed
        await supabase.auth.signOut();
        throw new Error('No tienes colegios activos asignados. Contacta al administrador para obtener acceso.');
      }
    } catch (error: any) {
      console.error('Unexpected error during login colegios check:', error);
      // Make sure to sign out on any error during validation
      await supabase.auth.signOut();
      throw error;
    }
  }

  // On successful authentication and validation, return the user profile data.
  if (authData.user) {
    const { password: _, ...clientUser } = userProfile;
    return clientUser as User;
  }

  return null;
}

function getStatusErrorMessage(status: string): string {
  switch (status) {
    case UserStatus.INACTIVE:
      return 'Tu cuenta está inactiva. Contacta al administrador para reactivarla.';
    case UserStatus.SUSPENDED:
      return 'Tu cuenta está suspendida. Contacta al administrador para más información.';
    default:
      return 'Estado de cuenta no válido. Contacta al administrador.';
  }
}

export async function logout(): Promise<void> {
  // This function's only responsibility is to sign out from Supabase.
  // The UI component will handle resetting the application state.
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    // We can re-throw or handle it as needed, but for now, logging is sufficient.
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile from the users table
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !userProfile) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  // Additional security check: ensure user is still active
  if (userProfile.status !== UserStatus.ACTIVE) {
    console.warn('User session found but account is not active:', userProfile.status);
    // Sign out the user since they're not active anymore
    await supabase.auth.signOut();
    return null;
  }

  // Check if user still has active colegios assigned (except for SUPER_ADMIN)
    if (userProfile.role !== 'SUPER_ADMIN') {
      try {
        // Primero verificamos directamente sin el join para evitar problemas de RLS
        const { data: userColegios, error: colegiosError } = await supabase
          .from('usuario_colegios')
          .select('colegio_id, role')
          .eq('user_id', userProfile.id);

        if (colegiosError) {
          console.error('Error checking user colegios:', colegiosError);
          console.log('User ID:', userProfile.id);
          console.log('User Role:', userProfile.role);
        }

        // Si no tiene asignaciones, denegar acceso
        if (!userColegios || userColegios.length === 0) {
          console.warn('User session found but has no colegios assigned. User ID:', userProfile.id);
          await supabase.auth.signOut();
          return null;
        }

        // Verificar que al menos un colegio esté activo
        const { data: activeColegios, error: activeError } = await supabase
          .from('colegios')
          .select('id, name, status')
          .in('id', userColegios.map(uc => uc.colegio_id))
          .eq('status', 'active');

        if (activeError) {
          console.error('Error checking active colegios:', activeError);
        }

        if (!activeColegios || activeColegios.length === 0) {
          console.warn('User has colegios assigned but none are active. User ID:', userProfile.id);
          await supabase.auth.signOut();
          return null;
        }
      } catch (error) {
        console.error('Unexpected error in getCurrentUser:', error);
        // En caso de error, permitir el acceso temporalmente para debugging
        console.warn('Allowing access despite error for debugging. User:', userProfile.username);
      }
    }

  const { password: _, ...clientUser } = userProfile;
  return clientUser as User;
}

// Update user password
export async function updatePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    // First verify the current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // Get user profile to retrieve email
    const { data: userProfile } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new Error('No se pudo obtener el perfil del usuario');
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userProfile.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error('Error al actualizar la contraseña: ' + updateError.message);
    }

    return true;
  } catch (error: any) {
    console.error('Error updating password:', error);
    throw error;
  }
}
