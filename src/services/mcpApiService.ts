import { mcpFetch } from '../utils/mcpFetch';

// Added Accept-Version header constant per MCP contract
const MCP_API_VERSION = '2024-07-01';

export async function fetchMCPCommands(apiUrl: string, userToken: string) {
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

export async function runMCPCommand(apiUrl: string, apiKey: string, command: string, args: any, provider = 'openai') {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  // Generate a UUID for progress tracking and send it via header
  let cmdId = '';
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    cmdId = crypto.randomUUID();
    headers['x-mcp-command-id'] = cmdId;
  }

  const res: any = await mcpFetch(`${apiUrl}/command`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider,
      apiKey,
      prompt: command,
      command,
      context: args.context || {},
      metadata: args.metadata || {}
    })
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