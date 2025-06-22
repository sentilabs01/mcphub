/*
 * Minimal MCP Gateway for local development on port 3001.
 *  - POST /command  { provider, command, apiKey }
 * Only Zapier handler implemented fully for demo; other providers echo back.
 */

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// In-memory token store per session (dev only)
let savedSlackToken = '';

app.get('/api/user/slack-token', (req, res) => {
  res.json({ token: savedSlackToken });
});

app.post('/api/user/slack-token', (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token required' });
  }
  savedSlackToken = token.trim();
  res.json({ ok: true });
});

app.delete('/api/user/slack-token', (req, res) => {
  savedSlackToken = '';
  res.json({ ok: true });
});

// Slack OAuth redirect helper (dev)
app.get('/api/slack/auth', (req, res) => {
  const clientId = req.query.client_id || process.env.SLACK_CLIENT_ID || '<YOUR_CLIENT_ID>';
  const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/slack/callback';
  const scopes = [
    'connections:write',
    'app_configurations:write',
    'authorizations:read',
    'commands',
    'chat:write',
    'channels:read'
  ].join(',');
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(url);
});

// Simple callback placeholder – exchange code for tokens in real impl
app.get('/api/slack/callback', (req, res) => {
  res.send('Slack OAuth completed. Implement token exchange here and redirect to MCP Hub.');
});

// Simple router
const commandController = async (req, res) => {
  const { provider, command = '', apiKey = '' } = req.body;
  const provKey = (provider || '').toString().toLowerCase().trim();
  console.log('[gateway]>>>>', provKey);
  try {
    switch (provKey) {
      case 'zapier': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing Zapier API key' });

        if (/^list zaps/i.test(command)) {
          const r = await fetch('https://nla.zapier.com/api/v1/ai_zaps', {
            headers: { Authorization: `Bearer ${key}` },
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }
        // fallback
        return res.status(400).json({ error: 'Unsupported Zapier command' });
      }
      case 'google_drive': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing Google OAuth token' });

        const cmd = (command || '').toLowerCase().trim();

        // List Drive files (default)
        if (/^(list(\s+drive)?\s+files|list\-files|get\s+drive\s+files|list\-drive\-files|\/drive\s+list|list)$/i.test(cmd)) {
          const r = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,webViewLink,webContentLink)', {
            headers: { Authorization: `Bearer ${key}` },
          });
          const data = await r.json();
          console.log('[Drive API]', r.status, Array.isArray(data.files), data.files?.length);
          return res.status(r.ok ? 200 : r.status).json(r.ok ? (data.files || []) : data);
        }

        // Search files: /drive search <query>
        const searchMatch = cmd.match(/search\s+(.+)/i);
        if (searchMatch) {
          const raw = searchMatch[1].trim();
          const q = encodeURIComponent(`name contains '${raw.replace(/'/g, "\\'")}'`);
          const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,webContentLink)&pageSize=100`, {
            headers: { Authorization: `Bearer ${key}` },
          });
          const data = await r.json();
          return res.status(r.ok ? 200 : r.status).json(r.ok ? (data.files || []) : data);
        }

        // Unhandled command fallback
        return res.status(400).json({ error: 'Unsupported Google Drive command', hint: 'Try "list drive files" or "/drive search <query>"' });
      }
      case 'google_calendar': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing Google OAuth token' });

        const cmd = (command || '').toLowerCase().trim();

        // List calendars
        if (/^(list--?calendars|calendars|list-calendars)$/i.test(cmd)) {
          const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${key}` },
          });
          const data = await r.json();
          return res.status(r.ok ? 200 : r.status).json(r.ok ? (data.items || []) : data);
        }

        // List events (default) – optional calendar ID: "list-events <calendarId>"
        const listEventsMatch = cmd.match(/^(list--?events|events|list-events)(?:\s+(\S+))?/i);
        if (listEventsMatch) {
          const calId = listEventsMatch[2] || 'primary';
          const timeMin = new Date().toISOString();
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?maxResults=100&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`;
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${key}` },
          });
          const data = await r.json();
          return res.status(r.ok ? 200 : r.status).json(r.ok ? (data.items || []) : data);
        }

        return res.status(400).json({ error: 'Unsupported Google Calendar command', hint: 'Try "list events" or "list calendars"' });
      }
      case 'gmail': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing Google OAuth token' });

        const cmd = (command || '').toLowerCase().trim();

        // List inbox messages (default)
        if (cmd === '' || /^(list(\s+my)?\s+)?(inbox|emails|messages|list-inbox|list-messages)$/i.test(cmd)) {
          const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX', {
            headers: { Authorization: `Bearer ${key}` },
          });
          const listJson = await listRes.json();
          if (!listRes.ok) return res.status(listRes.status).json(listJson);

          // Fetch basic metadata (snippet, subject) for each id in parallel (but cap to 20)
          const msgs = await Promise.all(
            (listJson.messages || []).slice(0, 20).map(async (m) => {
              try {
                const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject`, {
                  headers: { Authorization: `Bearer ${key}` },
                });
                const j = await r.json();
                if (!r.ok) return null;
                return {
                  id: j.id,
                  snippet: j.snippet,
                  subject: (j.payload?.headers || []).find((h) => h.name === 'Subject')?.value || '',
                };
              } catch {
                return null;
              }
            })
          );
          return res.json(msgs.filter(Boolean));
        }

        return res.status(400).json({ error: 'Unsupported Gmail command', hint: 'Try "/gmail list inbox"' });
      }
      case 'openai':
      case 'anthropic':
      case 'gemini':
      case 'github': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing GitHub token' });

        const cmd = command.toLowerCase().trim();

        // Create repository: "create-repo <name>"
        const createMatch = cmd.match(/^create[- ]repo\s+(.+)/i);
        if (createMatch) {
          const name = createMatch[1].trim().replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 100);
          if (!name) return res.status(400).json({ error: 'Repository name required' });
          const r = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `token ${key}`,
              'Accept': 'application/vnd.github+json',
            },
            body: JSON.stringify({ name, auto_init: true }),
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        // List repos (default)
        const r = await fetch('https://api.github.com/user/repos', {
          headers: { Authorization: `token ${key}` },
        });
        const repos = await r.json();
        console.log('[GitHub API]', r.status, Array.isArray(repos), repos.length);
        return res.status(r.status).json(repos);
      }
      case 'make_mcp_test': {
        const { zone, token } = req.body;
        if (!zone || !token) return res.status(400).json({ error: 'zone and token required' });
        const url = `https://${zone}/mcp/api/v1/u/${token}/sse`;
        try {
          const r = await fetch(url, { headers: { Accept: 'text/event-stream' } });
          return res.status(r.ok ? 200 : r.status).json({ ok: r.ok });
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'make_mcp_run': {
        console.log('[make_mcp_run] body', req.body);
        const { zone, token, scenarioId } = req.body;
        if (!zone || !token || !scenarioId) {
          return res.status(400).json({ error: 'zone, token and scenarioId required' });
        }
        const url = `https://${zone}/mcp/api/v1/u/${token}/execute/${scenarioId}`;
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args: {} }),
          });
          const text = await r.text();
          let json;
          try {
            json = JSON.parse(text);
          } catch {
            json = { raw: text };
          }
          return res.status(r.status).json(json);
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'make_webhook': {
        const { url } = req.body;
        if (!url || !/^https?:\/\/hook\./i.test(url)) {
          return res.status(400).json({ error: 'valid Make webhook URL required' });
        }
        try {
          const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          const text = await r.text();
          return res.status(r.status).type('text').send(text || 'OK');
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'make_api_validate': {
        const { token, zone } = req.body;
        if (!token) return res.status(400).json({ error: 'token required' });
        const host = zone ? `https://${zone}` : 'https://api.make.com';
        try {
          const r = await fetch(`${host}/api/v2/users/me`, {
            headers: { 'Authorization': `Token ${token}` },
          });
          return res.status(r.ok ? 200 : r.status).json({ ok: r.ok });
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'make_api_list': {
        const { token, zone } = req.body;
        if (!token) return res.status(400).json({ error: 'token required' });
        const host = zone ? `https://${zone}` : 'https://api.make.com';
        try {
          const r = await fetch(`${host}/api/v2/scenarios`, {
            headers: { 'Authorization': `Token ${token}` },
          });
          const txt = await r.text();
          let json;
          try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
          return res.status(r.status).json(json);
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'make_api_run': {
        const { token, scenarioId, zone } = req.body;
        if (!token || !scenarioId) return res.status(400).json({ error: 'token and scenarioId required' });
        const host = zone ? `https://${zone}` : 'https://api.make.com';
        try {
          const r = await fetch(`${host}/api/v2/scenarios/${scenarioId}/run`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`,
            },
            body: '{}',
          });
          const txt = await r.text();
          let json;
          try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
          return res.status(r.status).json(json);
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'make_mcp_list': {
        const { zone, token } = req.body;
        if (!zone || !token) return res.status(400).json({ error: 'zone and token required' });
        const url = `https://${zone}/mcp/api/v1/u/${token}/scenarios`;
        try {
          const r = await fetch(url, { headers: { Accept: 'application/json' } });
          const text = await r.text();
          let json;
          try { json = JSON.parse(text); } catch { json = { raw: text }; }
          return res.status(r.status).json(json);
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'zapier_mcp_cmd': {
        const { url, token, command } = req.body;
        if (!url || !token || !command) return res.status(400).json({ error: 'url, token, command required' });
        try {
          // Zapier MCP expects JSON-RPC style POST to base/execute (base ends before /sse)
          const baseUrl = url.replace(/\/?(sse|stream)$/i, '').replace(/\/$/, '');
          const endpoint = `${baseUrl}/execute`;

          // ---- Parse command string into slug + args ----
          const cmdParts = command.trim().match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
          // For Zapier MCP we must pass the slug exactly as configured (often includes multiple underscores).
          const slug = (cmdParts.shift() || '').trim();
          const argObj = {};
          for (const part of cmdParts) {
            const kv = part.split('=');
            if (kv.length === 2) {
              const key = kv[0];
              let value = kv[1];
              if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
              }
              argObj[key] = value;
            }
          }

          const rpcBody = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'execute',
            params: {
              command: slug,
              args: argObj,
            },
          };

          const r = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(rpcBody),
          });
          const txt = await r.text();
          let json;
          try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
          return res.status(r.status).json(json);
        } catch (err) {
          return res.status(500).json({ error: err.message || 'fetch failed' });
        }
      }
      case 'slack': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing Slack token' });

        const cmd = (command || '').toLowerCase().trim();

        if (cmd === 'connections open' || cmd === 'open connection' || cmd === 'connections-open') {
          const r = await fetch('https://slack.com/api/apps.connections.open', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}` },
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        if (cmd.startsWith('authorizations')) {
          const r = await fetch('https://slack.com/api/authorizations.list?limit=100', {
            headers: { Authorization: `Bearer ${key}` },
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        if (cmd === 'manifest export') {
          const r = await fetch('https://slack.com/api/apps.manifest.export', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}` },
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        const importMatch = cmd.match(/^manifest import\s+(.+)/);
        if (importMatch) {
          let manifestJson = importMatch[1].trim();
          try {
            // If user passed a URL, fetch it
            if (/^https?:\/\//i.test(manifestJson)) {
              const rUrl = await fetch(manifestJson);
              manifestJson = await rUrl.text();
            }
            const manifest = JSON.parse(manifestJson);
            const r = await fetch('https://slack.com/api/apps.manifest.import', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ manifest }),
            });
            const j = await r.json();
            return res.status(r.status).json(j);
          } catch (err) {
            return res.status(400).json({ error: 'Invalid manifest JSON or URL' });
          }
        }

        // ---------- Added basic Slack helpers ----------

        // /slack list channels   (aliases: channels, list-channels)
        if (cmd === 'list channels' || cmd === 'channels' || cmd === 'list-channels') {
          const r = await fetch('https://slack.com/api/conversations.list?limit=100', {
            headers: { Authorization: `Bearer ${key}` },
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        // /slack send <channel> <text…>
        const sendMatch = cmd.match(/^send\s+(\S+)\s+(.+)/);
        if (sendMatch) {
          const [, channel, text] = sendMatch;
          const r = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ channel, text }),
          });
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        // /slack get messages <channel> [limit]
        const histMatch = cmd.match(/^get\s+messages\s+(\S+)(?:\s+(\d+))?/);
        if (histMatch) {
          const [, channel, lim] = histMatch;
          const limit = lim || 20;
          const r = await fetch(
            `https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${key}` } }
          );
          const j = await r.json();
          return res.status(r.status).json(j);
        }

        return res.status(400).json({ error: 'Unsupported Slack command', hint: 'connections open | authorizations list | manifest export | manifest import <json|url>' });
      }
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err && err.message) || 'Internal error' });
  }
};

// Primary path (used by Vite proxy with rewrite) – optional
app.post('/command', commandController);
// Alias used by current front-end build (no rewrite)
app.post('/api/command', commandController);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Default gateway port; front-end dev proxy is configured accordingly in vite.config.ts
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`MCP Gateway listening on http://localhost:${PORT}`);
}); 