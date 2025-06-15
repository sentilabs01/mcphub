export function prettyPrintResult(provider: string, data: any): string {
  try {
    // Handle gateway echo wrapper { echo: {...} }
    if (data && typeof data === 'object' && 'echo' in data) {
      const echo = (data as any).echo;
      // Provide a concise summary instead of raw JSON
      if (echo && typeof echo === 'object') {
        const { provider: pId, command: cmd } = echo;
        return `Command acknowledged by MCP gateway → ${pId || provider}: ${cmd || ''}`.trim();
      }
      data = echo;
    }

    const p = provider.toLowerCase();
    switch (p) {
      case 'google_drive': {
        // API may return { files: [...] }
        const files = Array.isArray(data) ? data : (data && (data as any).files);
        if (Array.isArray(files)) {
          if (files.length === 0) return 'No Drive files found.';
          return files
            .slice(0, 50)
            .map((f: any, idx) => `${idx + 1}. ${f.name || 'Untitled'}  |  ID: ${f.id}`)
            .join('\n');
        }
        break;
      }
      case 'gmail': {
        const msgs = Array.isArray(data) ? data : (data && (data as any).messages);
        if (Array.isArray(msgs)) {
          if (msgs.length === 0) return 'No emails matching your query.';
          return msgs
            .slice(0, 20)
            .map((m: any, idx) => `${idx + 1}. ${m.subject || m.snippet || '(no subject)'}  – ${m.from || m.sender || ''}`)
            .join('\n');
        }
        break;
      }
      case 'github': {
        const repos = Array.isArray(data) ? data : (data && (data as any).repositories);
        if (Array.isArray(repos)) {
          if (repos.length === 0) return 'No repositories found.';
          return repos
            .slice(0, 30)
            .map((r: any, idx) => `${idx + 1}. ${r.full_name || r.name}`)
            .join('\n');
        }
        break;
      }
      default:
        break;
    }

    // Generic object pretty-print (for any other shape)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
    }
  } catch {
    /* ignore formatting errors */
  }
  // Fallback JSON pretty-print
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

// ----- DEV-ONLY helper (remove when you're done) -----
if (typeof window !== 'undefined') {
  // @ts-ignore – we purposely stick it on the global for quick testing
  window.prettyPrintResult = prettyPrintResult;
} 