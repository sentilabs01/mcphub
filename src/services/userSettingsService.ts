import { supabase } from '../lib/supabase';

export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function saveUserSettings(userId: string, { llm_provider, llm_api_keys }: { llm_provider: string, llm_api_keys: any }) {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      llm_provider,
      llm_api_keys,
      updated_at: new Date().toISOString(),
    });
  return !error;
} 