/*
 * Slack Service – light wrapper around Slack Web API to demonstrate integration.
 * For production use, consider using @slack/web-api package instead of fetch.
 */

export async function listSlackChannels(token: string): Promise<any[]> {
  if (!token) throw new Error('Slack token required');
  try {
    const res = await fetch('https://slack.com/api/conversations.list?limit=1000', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Slack API error');
    return data.channels || [];
  } catch (err) {
    console.error('[Slack] list channels failed', err);
    return [];
  }
}

export async function sendSlackMessage(token: string, channel: string, text: string): Promise<boolean> {
  if (!token) throw new Error('Slack token required');
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text }),
  });
  const data = await res.json();
  return data.ok || false;
}

export async function validateSlackToken(token: string): Promise<boolean> {
  if (!token) return false;

  // Preferred: POST form urlencoded (Slack accepts this, CORS-friendly)
  try {
    const body = new URLSearchParams({ token }).toString();
    const res = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok) return true;
    }
  } catch {/* ignore and fall back */}

  // Fallback to GET with query param (less reliable but no pre-flight)
  try {
    const qpRes = await fetch(`https://slack.com/api/auth.test?token=${encodeURIComponent(token)}`);
    if (qpRes.ok) {
      const data = await qpRes.json();
      if (data.ok) return true;
    }
  } catch {/* ignore and fall back */}

  // Last resort: Authorization header (will be blocked by CORS unless server-side)
  try {
    const res = await fetch('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ---------- New helpers matching scopes ----------

// apps.connections.open – requires connections:write. Returns a wss URL for Socket Mode.
export async function openSocketConnection(token: string): Promise<string> {
  const res = await fetch('https://slack.com/api/apps.connections.open', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'apps.connections.open failed');
  return data.url as string; // WebSocket URL
}

// authorizations.list – requires authorizations:read
export async function listAuthorizations(token: string, limit: number = 20): Promise<any[]> {
  const res = await fetch(`https://slack.com/api/authorizations.list?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'authorizations.list failed');
  return data.authorizations || [];
}

// apps.manifest.export – export current app manifest (app_configurations:write suffices for export)
export async function exportAppManifest(token: string): Promise<any> {
  const res = await fetch('https://slack.com/api/apps.manifest.export', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'manifest export failed');
  return data.manifest;
}

// apps.manifest.import – import / update manifest JSON
export async function importAppManifest(token: string, manifest: any): Promise<void> {
  const res = await fetch('https://slack.com/api/apps.manifest.import', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ manifest }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'manifest import failed');
}

// ---- Backend token storage helpers ----

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) || '';

export async function fetchStoredSlackToken(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/user/slack-token`, { credentials: 'include' });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.token || '';
  } catch {
    return '';
  }
}

export async function saveSlackTokenToBackend(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/user/slack-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteStoredSlackToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/user/slack-token`, { method: 'DELETE', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
} 