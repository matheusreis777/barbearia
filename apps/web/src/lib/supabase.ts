import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@barbearia/config';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
