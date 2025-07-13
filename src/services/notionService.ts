/*
 * Notion Service – minimal helpers for the Notion REST API
 * NOTE: This is a first-pass scaffold to enable integrations. Expand as needed.
 */

export interface NotionCredentials {
  apiKey: string; // "secret_xxx" integration token
}

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// Dev helper: many browsers block direct Notion REST calls (CORS).
// Allow optional proxy via VITE_CORS_PROXY (e.g. "https://corsproxy.io/")
const CORS_PROXY = typeof window !== 'undefined' ? (import.meta.env.VITE_CORS_PROXY as string | undefined) : undefined;

function withProxy(url: string): string {
  if (!CORS_PROXY) return url;
  return `${CORS_PROXY.replace(/\/$/, '')}/${url}`;
}

// If a server-side proxy is available, build its URL
function proxyUrl(serverApi: string, path: string): string {
  return `${serverApi.replace(/\/$/, '')}/proxy/notion`;
}

interface NotionProxyPayload {
  path: string;
  method?: string;
  body?: any;
  apiKey?: string;
}

async function fetchViaServer(serverApi: string, token: string, path: string, method: string = 'GET', body?: any): Promise<Response> {
  const payload: NotionProxyPayload = { path, method, body, apiKey: token };
  return fetch(proxyUrl(serverApi, path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Validate token by fetching current user info. Returns true if token accepted.
export async function validateNotionToken(token: string, serverApi?: string): Promise<boolean> {
  if (!token) throw new Error('Notion token missing');
  try {
    const target = `${NOTION_API_BASE}/users/me`;
    if (serverApi) {
      const res = await fetchViaServer(serverApi, token, 'users/me', 'GET');
      return res.ok;
    }
    let res: Response;
    try {
      res = await fetch(target, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
        },
      });
    } catch (err) {
      // Retry via proxy on network/CORS error if we have proxy set
      if (CORS_PROXY) {
        res = await fetch(withProxy(target), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': NOTION_VERSION,
          },
        });
      } else {
        throw err;
      }
    }
    return res.ok;
  } catch {
    return false;
  }
}

// List pages the token has access to (search endpoint). Returns [] on error.
export async function listNotionPages(token: string, query: string = ''): Promise<any[]> {
  try {
    const target = `${NOTION_API_BASE}/search`;
    const fetchWith = async (url: string) => fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, page_size: 20 }),
    });

    let res: Response;
    try {
      res = await fetchWith(target);
    } catch (err) {
      if (CORS_PROXY) {
        res = await fetchWith(withProxy(target));
      } else {
        throw err;
      }
    }
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
} 