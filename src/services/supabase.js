import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from Env or LocalStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hasEnv = envUrl && 
                 envUrl !== 'your_supabase_project_url' && 
                 envUrl !== '' && 
                 envKey && 
                 envKey !== 'your_supabase_anon_key' && 
                 envKey !== '';
  
  if (hasEnv) {
    return { url: envUrl, key: envKey, isEnv: true };
  }
  
  const localUrl = localStorage.getItem('edu_supabase_url');
  const localKey = localStorage.getItem('edu_supabase_anon_key');
  
  return { url: localUrl || '', key: localKey || '', isEnv: false };
};

const config = getSupabaseConfig();

export const supabase = (config.url && config.key)
  ? createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export const isSupabaseConfigured = () => {
  const currentConfig = getSupabaseConfig();
  return !!(currentConfig.url && currentConfig.key);
};

export const updateSupabaseCredentials = (url, key) => {
  if (url) localStorage.setItem('edu_supabase_url', url.trim());
  if (key) localStorage.setItem('edu_supabase_anon_key', key.trim());
  window.location.reload();
};

export const clearSupabaseCredentials = () => {
  localStorage.removeItem('edu_supabase_url');
  localStorage.removeItem('edu_supabase_anon_key');
  window.location.reload();
};
