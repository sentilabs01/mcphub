export function splitMcpEndpoint(full: string): { base: string; token: string } | null {
  if (!full) return null;
  try {
    const url = new URL(full.trim());
    // Remove trailing /sse or /stream if present
    let path = url.pathname.replace(/\/?(sse|stream)$/i, '');
    // Normalise double slashes
    path = path.replace(/\/+/g, '/');
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) return null;

    // Legacy style: /mcp/sk-ak-....
    const legacyIdx = parts.findIndex(p => p.startsWith('sk-'));
    if (legacyIdx !== -1) {
      const token = parts[legacyIdx];
      const base = `${url.origin}/mcp/${token}`;
      return { base, token };
    }

    // New style: /api/mcp/s/<token> or /mcp/s/<token>
    const sIdx = parts.findIndex(p => p === 's');
    if (sIdx !== -1 && parts[sIdx + 1]) {
      const token = parts[sIdx + 1];
      const prefix = parts.slice(0, sIdx + 2).join('/'); // up to token inclusive
      const base = `${url.origin}/${prefix}`;
      return { base, token };
    }

    // Fallback: assume last segment is token if sufficiently long (>=10 chars) and not common keyword
    const last = parts[parts.length - 1];
    if (last.length >= 10 && !['mcp', 'api', 's'].includes(last)) {
      const base = `${url.origin}/${parts.slice(0, parts.length).join('/')}`;
      return { base, token: last };
    }

    return null;
  } catch {
    return null;
  }
} 