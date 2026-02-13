import { supabase, isSupabaseConfigured } from './supabase';
import { User, UserRole } from '@/types/auth';

// Mock users for demo mode
const MOCK_USERS: User[] = [
  { id: 'usr-super', name: 'Super Admin', email: 'super@edugrade.com', role: UserRole.SUPER_ADMIN, username: 'Admin', password: 'Admin123' },
  { id: 'usr-admin', name: 'Admin Colegio', email: 'admin@colegio.com', role: UserRole.ADMIN_COLEGIO, username: 'Colegio', password: 'ColAdmin' },
  { id: 'usr-teacher-1', name: 'Jhon Doe', email: 'jhon.doe@colegio.com', role: UserRole.DOCENTE, username: 'Jhon', password: 'Profe123' },
  { id: 'usr-teacher-2', name: 'Jane Smith', email: 'jane.smith@colegio.com', role: UserRole.DOCENTE, username: 'Jane', password: 'Profe123' },
];

export async function login(username: string, password: string): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode login
    if (username === 'Admin' && password === 'Admin123') return MOCK_USERS.find(u => u.role === UserRole.SUPER_ADMIN) || null;
    if (username === 'Colegio' && password === 'ColAdmin') return MOCK_USERS.find(u => u.role === UserRole.ADMIN_COLEGIO) || null;
    if (username === 'Jhon' && password === 'Profe123') return MOCK_USERS.find(u => u.username === 'Jhon') || null;
    if (username === 'Jane' && password === 'Profe123') return MOCK_USERS.find(u => u.username === 'Jane') || null;
    return null;
  }

  // First, get the user's email from their username, as Supabase Auth uses email.
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !userProfile) {
    console.error('Login failed: could not find user profile for username:', username, profileError);
    return null;
  }

  // Now, attempt to sign in with Supabase Auth using the retrieved email and provided password.
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userProfile.email,
    password: password,
  });

  if (authError) {
    console.error('Supabase auth error:', authError);
    return null;
  }

  // On successful authentication, the Supabase client will automatically manage the session.
  // RLS policies using `auth.uid()` will now work for subsequent requests.
  if (authData.user) {
    // Return the user profile data to the app, excluding the password.
    const { password: _, ...clientUser } = userProfile;
    return clientUser as User;
  }

  return null;
}

export async function logout(): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return Promise.resolve();
  }
  
  // This function's only responsibility is to sign out from Supabase.
  // The UI component will handle resetting the application state.
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    // We can re-throw or handle it as needed, but for now, logging is sufficient.
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

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

  const { password: _, ...clientUser } = userProfile;
  return clientUser as User;
}
