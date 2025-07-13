import { mcpFetch } from '../utils/mcpFetch';
import { supabase } from '../lib/supabase';
import { getValidGoogleToken } from './googleToken';
import { safeGet } from '../utils/safeLocal';

// Added Accept-Version header constant per MCP contract
const MCP_API_VERSION = '2024-07-01';

export async function fetchMCPCommands(apiUrl: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const userToken = session?.access_token;
  return mcpFetch(`${apiUrl}/commands`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
}

// Helper to poll job endpoint until done or error
async function pollJob(apiUrl: string, jobId: string, token?: string, retry = 0): Promise<any> {
  const res = await mcpFetch(`${apiUrl}/job/${jobId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  // mcpFetch already throws on error; here res is parsed JSON
  const data: any = res;
  if (data.done) {
    if (data.error) throw new Error(data.error);
    return data.result ?? data;
  }
  const wait = Math.min(500 + retry * 200, 5000);
  await new Promise(r => setTimeout(r, wait));
  return pollJob(apiUrl, jobId, token, retry + 1);
}

export async function runMCPCommand(apiUrl: string, command: string, args: any, provider = 'openai') {
  const { data: { session } } = await supabase.auth.getSession();
  const apiKey = session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Google providers must use Google OAuth token as Bearer
  const githubProviders = ['github'];
  const googleProviders = [
    'google_drive',
    'gmail',
    'google_calendar',
    'drive',
    'calendar',
  ];
  let useGitHubToken = githubProviders.includes(provider);
  let useGoogleToken = googleProviders.includes(provider);

  if (githubProviders.includes(provider)) {
    const githubToken = localStorage.getItem('github_token') || '';
    console.log('[MCP] Using GitHub token for provider', provider, githubToken);
    headers['Authorization'] = `Bearer ${githubToken}`;
  } else if (useGoogleToken) {
    // Force use of localStorage token for Google providers
    const googleToken = safeGet('googleToken') || safeGet('google_token') || '';
    console.log('[MCP] FORCED Google token for provider', provider, googleToken);
    headers['Authorization'] = `Bearer ${googleToken}`;
  } else if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Generate a UUID for progress tracking and send it via header
  let cmdId = '';
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    cmdId = crypto.randomUUID();
    headers['x-mcp-command-id'] = cmdId;
  }

  // Remove apiKey from body for Google providers
  const bodyObj: any = {
    provider,
    prompt: command,
    command,
    context: args.context || {},
    metadata: args.metadata || {}
  };

  // Only include apiKey for non-GitHub and non-Google providers
  if (!useGitHubToken && !useGoogleToken) {
    bodyObj.apiKey = apiKey;
  }

  const res: any = await mcpFetch(`${apiUrl}/command`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj)
  });

  if (res && res.jobId) {
    const { jobId, eta } = res;
    if (!jobId) throw new Error('Job accepted but no jobId returned');
    if (typeof window !== 'undefined') console.log('[MCP] async job accepted', { jobId, eta });
    return pollJob(apiUrl, jobId, apiKey);
  }

  const data = res;
  if (typeof window !== 'undefined') {
    // Front-end dev helper: inspect gateway responses in browser console
    console.log('[MCP result]', data);
  }
  return data;
} 