import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseConfig } from '@barbearia/config';

export type AuthUser = User;

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

export async function signUp(email: string, password: string, options?: { nome?: string }) {
  const supabase = getSupabaseClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: options ? { nome: options.nome } : undefined,
    },
  });
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  const supabase = getSupabaseClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = getSupabaseClient();
  return supabase.auth.getSession();
}

export async function getUser() {
  const supabase = getSupabaseClient();
  return supabase.auth.getUser();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const supabase = getSupabaseClient();
  return supabase.auth.onAuthStateChange(callback);
}

export const supabase = getSupabaseClient();
