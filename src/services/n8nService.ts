/**
 * Ping the n8n REST API to validate the instance URL and optional API key.
 * If the endpoint returns HTTP 200 we consider the credentials valid.
 * Any network error or 401/403 is treated as invalid.
 */
export async function validateN8nCredentials(baseUrl: string, apiKey?: string): Promise<boolean> {
  if (!baseUrl) throw new Error('Base URL required');

  // Normalise URL – strip trailing slashes
  let url = baseUrl.trim().replace(/\/+$/, '');
  // n8n exposes REST endpoints under /rest. We fetch the /workflows list (limit 1) as a quick health-check.
  url += '/rest/workflows?limit=1';

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: apiKey ? { 'X-N8n-Api-Key': apiKey } : {},
    });

    // 200 means reachable (and key accepted if provided). 401/403 means key rejected.
    return res.ok;
  } catch (_) {
    return false; // network failure counts as invalid
  }
} 