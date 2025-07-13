import { supabase } from '../lib/supabase';

export async function getUserChatHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('user_chat_history')
    .select('message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).reverse();
}

export async function addUserChatMessage(userId: string, message: { role: string, content: string }) {
  const { error } = await supabase
    .from('user_chat_history')
    .insert({
      user_id: userId,
      message,
      created_at: new Date().toISOString(),
    });
  return !error;
} 