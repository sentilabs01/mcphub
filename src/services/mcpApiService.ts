export async function fetchMCPCommands(apiUrl: string, userToken: string) {
  const res = await fetch(`${apiUrl}/commands`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch commands');
  return res.json();
}

export async function runMCPCommand(apiUrl: string, apiKey: string, command: string, args: any, provider = 'openai') {
  const res = await fetch(`${apiUrl}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      provider,
      apiKey,
      prompt: command,
      command,
      context: args.context || {},
      metadata: args.metadata || {}
    })
  });
  if (!res.ok) {
    let errorMsg = `Command failed (status ${res.status})`;
    try {
      const text = await res.text();
      if (text) errorMsg += `: ${text}`;
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