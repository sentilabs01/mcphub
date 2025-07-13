// Basic helper for Zapier AI Actions (NLA) REST API

const ZAPIER_NLA_BASE = 'https://nla.zapier.com/v1';

type HttpMethod = 'GET' | 'POST';

async function request<T>(path: string, apiKey: string, method: HttpMethod = 'GET', body?: any): Promise<T> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${ZAPIER_NLA_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Zapier NLA ${method} ${path} failed (${res.status}): ${txt}`);
  }
  return res.json() as Promise<T>;
}

export async function listZapierActions(apiKey: string) {
  return request<any[]>('/actions', apiKey);
}

export async function listZapierZaps(apiKey: string) {
  return request<any[]>('/zaps', apiKey);
}

export async function runZapierAction(apiKey: string, actionId: string, input: any) {
  // POST /actions/:id/run
  return request<any>(`/actions/${actionId}/run`, apiKey, 'POST', { input });
} 