/*
 * Minimal MCP Gateway for local development on port 3001.
 *  - POST /command  { provider, command, apiKey }
 * Only Zapier handler implemented fully for demo; other providers echo back.
 */

import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

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
      case 'openai':
      case 'anthropic':
      case 'gemini':
      case 'gmail':
      case 'google_drive':
      case 'github':
        return res.json({ echo: { provider, command, promptLength: command.length } });
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MCP Gateway listening on http://localhost:${PORT}`);
}); 