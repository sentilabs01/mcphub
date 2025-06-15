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
  try {
    switch ((provider || '').toLowerCase()) {
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
          const pretty = prettyPrintResult('google_drive', data.files || []);
          console.log('[pretty]', pretty);
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
      case 'openai':
      case 'anthropic':
      case 'gemini':
      case 'gmail':
      case 'github': {
        const key = apiKey || req.headers.authorization?.replace('Bearer ', '');
        if (!key) return res.status(401).json({ error: 'Missing GitHub token' });

        const r = await fetch('https://api.github.com/user/repos', {
          headers: { Authorization: `token ${key}` },
        });
        const repos = await r.json();
        console.log('[GitHub API]', r.status, Array.isArray(repos), repos.length);
        return res.status(r.status).json(repos);
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MCP Gateway listening on http://localhost:${PORT}`);
}); 