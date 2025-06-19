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

// Simple router
const commandController = async (req, res) => {
  const { provider, command = '', apiKey = '' } = req.body;
  const provKey = (provider || '').toString().toLowerCase().trim();
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
        if (/^(list( drive)? files|get drive files|list-drive-files|\/drive list|list)$/i.test(cmd)) {
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
      case 'openai':
      case 'anthropic':
      case 'gemini':
      case 'gmail':
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
      case 'make_api_run': {
        const { token, scenarioId } = req.body;
        if (!token || !scenarioId) return res.status(400).json({ error: 'token and scenarioId required' });
        try {
          const r = await fetch(`https://api.make.com/v2/scenarios/${scenarioId}/run`, {
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