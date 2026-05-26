import { supabase } from '../supabase';
import type { User, Session } from '@supabase/supabase-js';

export type AuthUser = User;
export type AuthSession = Session;

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Gmail scopes removed for development - add back for Gmail scanning features
      // scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    throw error;
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (user: User | null, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, session);
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session?.provider_token;

  if (!providerToken) {
    return null;
  }

  return providerToken;
};
