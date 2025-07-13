import { supabase } from '../lib/supabase';

export async function getUserIntegrationAccounts(userId: string) {
  const { data, error } = await supabase
    .from('user_integration_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function addUserIntegrationAccount(userId: string, provider: string, accountLabel: string, credentials: any) {
  const { data, error } = await supabase
    .from('user_integration_accounts')
    .insert({
      user_id: userId,
      provider,
      account_label: accountLabel,
      credentials,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return null;
  return data;
}

export async function updateUserIntegrationAccount(id: string, credentials: any) {
  const { data, error } = await supabase
    .from('user_integration_accounts')
    .update({
      credentials,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return data;
}

export async function deleteUserIntegrationAccount(id: string) {
  const { error } = await supabase
    .from('user_integration_accounts')
    .delete()
    .eq('id', id);
  return !error;
} 