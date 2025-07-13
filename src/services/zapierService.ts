export async function triggerZapierWebhook(webhookUrl: string, payload: any = {}): Promise<boolean> {
  if (!webhookUrl) {
    throw new Error('Zapier webhook URL is required');
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Failed to trigger Zap (status ${res.status})`);
    }

    return true;
  } catch (err: any) {
    // Surface human-readable error message to caller
    throw new Error(err.message || 'Unknown error triggering Zap');
  }
}

// ----------------------------
// AI-Actions (NLA) helpers
// ----------------------------

/**
 * Quick ping against Zapier NLA list-actions endpoint to prove an API key works.
 * If the call succeeds (HTTP 200) we assume the key is valid.
 */
export async function validateZapierApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) throw new Error('API key required');

  try {
    const res = await fetch('https://nla.zapier.com/v1/actions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      // 401/403 means key rejected; anything else still counts as failure
      return false;
    }

    // A valid key returns JSON list of enabled actions
    return true;
  } catch (err) {
    // Network or other error → treat as invalid
    return false;
  }
} 