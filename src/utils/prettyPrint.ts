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
        // Result shapes: direct array OR { messages: [...] } OR { raw_response: { messages: [...] } }
        let msgs: any = null;
        if (Array.isArray(data)) msgs = data;
        else if (data && Array.isArray((data as any).messages)) msgs = (data as any).messages;
        else if (data && (data as any).raw_response && Array.isArray((data as any).raw_response.messages)) {
          msgs = (data as any).raw_response.messages;
        }

        if (Array.isArray(msgs)) {
          if (msgs.length === 0) return 'No emails matching your query.';
          return msgs
            .slice(0, 20)
            .map((m: any, idx) => {
              const subject = m.subject || '';
              const snippet = m.snippet || m.snippetText || '';
              const from = m.from || m.sender || '';
              const id = m.id || m.messageId || '';
              const date = m.date || m.internalDate || '';
              const subjCol = (subject || '(no subject)').slice(0, 60).padEnd(60);
              const fromCol = from.slice(0, 24).padEnd(24);
              const dateCol = date.toString().slice(0, 16).padEnd(16);
              const headerLine = `${idx + 1}. ${subjCol}  ${fromCol}  ${dateCol}  ID: ${id}`;
              const snip = snippet && snippet !== subject ? `\n    ${snippet.slice(0, 120)}` : '';
              return headerLine + snip;
            })
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