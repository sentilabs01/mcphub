/**
 * Validate Make.com (formerly Integromat) API credentials by calling the `GET /v2/users/me` endpoint.
 * According to the Make docs this endpoint returns basic profile information when the token is accepted.
 *
 * Returns true for HTTP 200; false otherwise.
 */
export async function validateMakeCredentials(baseUrl: string, apiKey: string): Promise<boolean> {
  if (!baseUrl) baseUrl = 'https://api.make.com';
  if (!apiKey) throw new Error('API key required');

  // Strip trailing slashes for safety
  const url = baseUrl.replace(/\/+$/, '') + '/v2/users/me';

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return res.ok; // 200 → success; anything else → invalid
  } catch (_) {
    return false;
  }
} 