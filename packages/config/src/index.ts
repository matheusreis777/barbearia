export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL!,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
};

export const appConfig = {
  appName: 'Barbearia',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
};
