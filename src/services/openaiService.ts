export async function validateOpenAIApiKey(apiKey: string): Promise<'valid' | 'invalid' | 'quota_exceeded' | 'error'> {
  if (!apiKey) return 'invalid';
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) return 'invalid';
    if (res.status === 429) return 'quota_exceeded';
    if (!res.ok) return 'error';
    return 'valid';
  } catch {
    return 'error';
  }
} 