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
        // Accept shapes: array directly, { files: [...] }, { output: [...]|string }
        let files: any = null;
        if (Array.isArray(data)) files = data;
        else if (data && Array.isArray((data as any).files)) files = (data as any).files;
        else if (data && Array.isArray((data as any).output)) files = (data as any).output;
        else if (data && typeof (data as any).output === 'string') {
          // output string with newline-separated entries "id | name | mimeType"
          files = (data as any).output.split(/\n+/).filter(Boolean).map((line: string) => {
            const parts = line.split(/\s+\|\s+/);
            return { id: parts[0], name: parts[1] || parts[0] };
          });
        }
        if (Array.isArray(files)) {
          if (files.length === 0) return 'No Drive files found.';
          return files.slice(0, 50).map((f: any, idx) => `${idx + 1}. ${f.name || 'Untitled'}`).join('\n');
        }
        break;
      }
      case 'gmail': {
        // Accept array, { messages: [...] }, wrappers, { output: [...] }
        let msgs: any = null;
        if (Array.isArray(data)) msgs = data;
        else if (data && Array.isArray((data as any).messages)) msgs = (data as any).messages;
        else if (data && (data as any).raw_response && Array.isArray((data as any).raw_response.messages)) {
          msgs = (data as any).raw_response.messages;
        } else if (data && Array.isArray((data as any).output)) {
          msgs = (data as any).output;
        }
        if (Array.isArray(msgs)) {
          if (msgs.length === 0) return 'No emails matching your query.';
          return msgs
            .slice(0, 20)
            .map((m: any, idx) => {
              const subject = m.subject || m.snippet?.slice(0, 60) || '(no subject)';
              const from = m.from || m.sender || '';
              const date = m.date || m.internalDate || '';
              return `${idx + 1}. ${subject}  |  ${from}  |  ${date}`;
            })
            .join('\n');
        }
        break;
      }
      case 'github': {
        // Expand accepted shapes: direct array, { repositories: [...] }, { raw_response: [...] }, { raw_response: { repositories: [...] } }
        let repos: any = null;
        if (Array.isArray(data)) repos = data;
        else if (data && Array.isArray((data as any).repositories)) repos = (data as any).repositories;
        else if (data && Array.isArray((data as any).raw_response)) repos = (data as any).raw_response;
        else if (data && (data as any).raw_response && Array.isArray((data as any).raw_response.repositories)) {
          repos = (data as any).raw_response.repositories;
        }
        if (Array.isArray(repos)) {
          if (repos.length === 0) return 'No repositories found.';
          return repos
            .slice(0, 30)
            .map((r: any, idx) => `${idx + 1}. ${r.full_name || r.name}`)
            .join('\n');
        }
        break;
      }
      case 'google_calendar': {
        // Accept array of events or { items: [...] } etc.
        if (typeof data === 'string') {
          // Could already be prettified by backend
          return data;
        }
        let events: any = null;
        if (Array.isArray(data)) events = data;
        else if (data && Array.isArray((data as any).items)) events = (data as any).items;
        else if (data && (data as any).raw_response && Array.isArray((data as any).raw_response.items)) {
          events = (data as any).raw_response.items;
        } else if (data && Array.isArray((data as any).output)) {
          events = (data as any).output;
        }

        if (Array.isArray(events)) {
          if (events.length === 0) return 'No calendar events.';
          return events.slice(0, 20).map((e: any, idx) => {
            const startObj = e.start || {};
            const rawStart = startObj.dateTime || startObj.date || '';
            const dateStr = rawStart.toString().slice(0, 16);
            const title = e.summary || '(no title)';
            return `${idx + 1}. ${dateStr} | ${title}`;
          }).join('\n');
        }
        break;
      }
      case 'make_com': {
        if (Array.isArray(data)) {
          if (data.length === 0) return 'No scenarios found.';
          return data.slice(0, 30).map((s:any, idx:number)=>`${idx+1}. ${s.id || s.uid || s.scenarioId}  ${s.name || s.label || ''}`).join('\n');
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