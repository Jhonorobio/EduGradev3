import { supabase } from './supabase';
import { User } from '@/types/auth';

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

  const { password: _, ...clientUser } = userProfile;
  return clientUser as User;
}
