import { supabase } from '../lib/supabase';

const TABLE = 'user_integration_accounts';

export interface CredentialRecord {
  id: string;
  user_id: string;
  provider: string;
  account_label: string;
  credentials: any;
  created_at: string;
  updated_at: string;
}

export async function getCredential(userId: string, provider: string): Promise<CredentialRecord | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
  if (error) return null;
  return data as CredentialRecord;
}

export async function saveCredential(userId: string, provider: string, credentials: any, label = 'default'): Promise<boolean> {
  // upsert by user+provider
  const { error } = await supabase.from(TABLE).upsert({
    user_id: userId,
    provider,
    account_label: label,
    credentials,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function deleteCredential(userId: string, provider: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  return !error;
} 