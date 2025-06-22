# Backend / Supabase Memo – 2025-06-21

> Compiled by Front-End team after implementing new MCP fetch layer and UI indicators.

## 1  Google token refresh
* Definitive route confirmed: **POST `/google/refresh`** (alias `POST /refresh`).
* UI will switch to this endpoint once deployed. Response MUST be `{ access_token, expires_in }`.

## 2  Error envelope (BREAKING)
All new `/api/*` routes now return on failure:
```json
{ "ok": false, "code": "AUTH_EXPIRED" | "VALIDATION" | "RATE_LIMIT" | "SERVER", "message": "…" }
```
* `message` is what the UI surfaces verbatim.
* `code` is mapped to colour (red, yellow, etc.).
* Legacy plain-text responses were patched; front-end removed its fallback logic.

## 3  Async-job progress
* `/command` already returns `202 { jobId, eta }`.
* An **SSE** stream is live at `/mcp/events` – events:
  * `command-progress` → `{ id, percent, stage, message }`
  * `command-complete` → `{ id, success, error? }`

UI will integrate once VSF backlog clears; no change needed server-side.

## 4  Credential semantics
* DAO keeps **all** credentials; server treats **latest saved** as active.
* No `account_id` param required except Jira basic-auth fallback.

## 5  Jira
* For Cloud instances use OAuth (PKCE); PATs no longer needed. UI will replace PAT input with **"Connect Jira"** (hits `/api/auth/jira/url`).
* Site admin toggles ("public forms", "app links") do **not** affect 3-legged scopes.

## 6  Health / status pings
* Generic ➜ **`/health`**.
* Provider-specific ➜ **`/api/<provider>/status`** returning `{ connected:boolean }`.
  * Already live for google, github, slack, notion, jira.

## 7  Versioning
* Header `Accept-Version: 2024-07-01` is recognised now.
* Next breaking version will be announced **≥ 1 week** ahead for polyfill branch.

---
### Pending housekeeping (server side)
* Duplicate block in **`backend/index.js`** (variable redeclare) – please prune.
* Ensure Google refresh route requires only refresh_token in body.

Any questions → #mcp-backend on Slack. 