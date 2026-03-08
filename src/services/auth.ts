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

  // Check if user has any active colegios assigned (except for SUPER_ADMIN)
  if (userProfile.role !== 'SUPER_ADMIN') {
    const { data: userColegios, error: colegiosError } = await supabase
      .from('usuario_colegios')
      .select(`
        colegio_id,
        role,
        colegios!inner(
          id,
          name,
          status
        )
      `)
      .eq('user_id', userProfile.id)
      .eq('colegios.status', 'active');

    if (colegiosError) {
      console.error('Error checking user colegios:', colegiosError);
      throw new Error('Error al verificar colegios del usuario');
    }

    // If user has no active colegios, deny login
    if (!userColegios || userColegios.length === 0) {
      console.error('Login failed: user has no active colegios assigned');
      throw new Error('No tienes colegios activos asignados. Contacta al administrador para obtener acceso.');
    }
  }

  // Now, attempt to sign in with Supabase Auth using retrieved email and provided password.
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userProfile.email,
    password: password,
  });

  if (authError) {
    console.error('Supabase auth error:', authError);
    return null;
  }

  // On successful authentication, Supabase client will automatically manage session.
  // RLS policies using `auth.uid()` will now work for subsequent requests.
  if (authData.user) {
    // Return the user profile data to the app, excluding password.
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
    const { data: userColegios, error: colegiosError } = await supabase
      .from('usuario_colegios')
      .select(`
        colegio_id,
        role,
        colegios!inner(
          id,
          name,
          status
        )
      `)
      .eq('user_id', userProfile.id)
      .eq('colegios.status', 'active');

    if (colegiosError) {
      console.error('Error checking user colegios:', colegiosError);
      // Don't sign out for this error, just log it
    }

    // If user has no active colegios, sign them out
    if (!userColegios || userColegios.length === 0) {
      console.warn('User session found but has no active colegios assigned');
      await supabase.auth.signOut();
      return null;
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
