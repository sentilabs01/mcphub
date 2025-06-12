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
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider,
      apiKey,
      prompt: command,
      context: args.context || {},
      metadata: args.metadata || {}
    })
  });
  if (!res.ok) throw new Error('Command failed');
  return res.json();
} 