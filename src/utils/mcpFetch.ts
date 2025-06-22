export interface MCPError extends Error {
  code: 'AUTH_EXPIRED' | 'VALIDATION' | 'RATE_LIMIT' | 'SERVER' | 'NETWORK';
  status?: number;
}

/**
 * Wrapper around fetch that
 *  1. injects Accept-Version header
 *  2. parses MCP error envelopes `{ ok:false, code, message }`
 *  3. dispatches custom events for UI indicators
 */
export async function mcpFetch<T = any>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const MCP_API_VERSION = '2024-07-01';
  const headers: Record<string, string> = {
    'Accept-Version': MCP_API_VERSION,
    ...(init.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(input, { ...init, headers });
  } catch (networkErr: any) {
    const err: MCPError = Object.assign(new Error('Network error'), {
      code: 'NETWORK' as const,
    });
    window.dispatchEvent(new CustomEvent('mcp:network-error', { detail: err }));
    throw err;
  }

  let bodyText = '';
  try {
    bodyText = await res.text();
  } catch {}

  const tryJson = () => {
    try {
      return JSON.parse(bodyText);
    } catch {
      return null;
    }
  };

  if (!res.ok) {
    const parsed = tryJson();
    const code = (parsed?.code as MCPError['code']) || 'SERVER';
    const msg = parsed?.message || `Request failed (${res.status})`;
    const err: MCPError = Object.assign(new Error(msg), {
      code,
      status: res.status,
    });
    const eventName = code === 'AUTH_EXPIRED' ? 'mcp:auth-error' : 'mcp:server-error';
    window.dispatchEvent(new CustomEvent(eventName, { detail: err }));
    throw err;
  }

  const json = bodyText ? tryJson() : null;
  // successful but not JSON – return text
  return (json ?? (bodyText as unknown)) as T;
} 