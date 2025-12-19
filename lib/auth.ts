import { supabase } from './supabase/client';

export type UserRole = 'ADMIN' | 'BRAND' | 'USER';
export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  provider?: AuthProvider;
  email_verified?: boolean;
  created_at: string;
}

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'USER'
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to create user' };
    }

    // Create user record in our users table
    const { data: userData, error: userError } = await supabase

    if (userError) {
      // If user creation fails, try to clean up auth user (best effort)
      await supabase.auth.signOut();
      return { user: null, error: userError.message };
    }

    return { user: userData, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: 'Invalid credentials' };
    }

    if (!authData.user) {
      return { user: null, error: 'Invalid credentials' };
    }

    // Fetch user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError || !userData) {
      return { user: null, error: 'User not found' };
    }

    // Update last sign in
    await supabase
      .from('profiles')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', userData.id);

    return { user: userData, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Sign in with OAuth provider (Google, Apple, Facebook)
export async function signInWithOAuth(
  provider: 'google' | 'apple' | 'facebook'
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get session from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // Fetch user data from our users table
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !userData) {
      return null;
    }

    return userData;
  } catch {
    return null;
  }
}

// Handle OAuth callback and create user record if needed
export async function handleOAuthCallback(): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { user: null, error: 'No session found' };
    }

    const authUser = session.user;

    // Check if user record exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingUser) {
      // Update last sign in
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', existingUser.id);

      return { user: existingUser, error: null };
    }

    // Create new user record for OAuth user
    const provider = authUser.app_metadata.provider as AuthProvider || 'email';
    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'USER',
          provider,
          provider_id: authUser.user_metadata?.provider_id,
          email_verified: authUser.email_confirmed_at !== null,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        },
      ])
      .select()
      .single();

    if (createError) {
      return { user: null, error: createError.message };
    }

    return { user: newUser, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      callback(userData);
    } else {
      callback(null);
    }
  });
}
