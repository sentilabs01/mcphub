// Added Accept-Version header constant per MCP contract
const MCP_API_VERSION = '2024-07-01';

export async function fetchMCPCommands(apiUrl: string, userToken: string) {
  const res = await fetch(`${apiUrl}/commands`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Accept-Version': MCP_API_VERSION,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch commands');
  return res.json();
}

// Helper to poll job endpoint until done or error
async function pollJob(apiUrl: string, jobId: string, token?: string, retry = 0): Promise<any> {
  const res = await fetch(`${apiUrl}/job/${jobId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Accept-Version': MCP_API_VERSION,
    },
  });
  if (!res.ok) {
    throw new Error(`Job status fetch failed (${res.status})`);
  }
  const data = await res.json();
  if (data.done) {
    if (data.error) throw new Error(data.error);
    return data.result ?? data;
  }
  // simple back-off: min(500ms + retry*200ms, 5000ms)
  const wait = Math.min(500 + retry * 200, 5000);
  await new Promise(r => setTimeout(r, wait));
  return pollJob(apiUrl, jobId, token, retry + 1);
}

export async function runMCPCommand(apiUrl: string, apiKey: string, command: string, args: any, provider = 'openai') {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Version': MCP_API_VERSION,
  };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(`${apiUrl}/command`, {
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

  if (res.status === 202) {
    // Async job created; poll until done
    const { jobId, eta } = await res.json();
    if (!jobId) throw new Error('Job accepted but no jobId returned');
    if (typeof window !== 'undefined') {
      console.log('[MCP] async job accepted', { jobId, eta });
    }
    const result = await pollJob(apiUrl, jobId, apiKey);
    return result;
  }

  if (!res.ok) {
    let errorMsg = `Command failed (status ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMsg += `: ${errJson.error}`;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (typeof window !== 'undefined') {
    // Front-end dev helper: inspect gateway responses in browser console
    // eslint-disable-next-line no-console
    console.log('[MCP result]', data);
  }
  return data;
} 