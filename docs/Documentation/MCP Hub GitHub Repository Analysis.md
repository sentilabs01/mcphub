# MCP Hub GitHub Repository Analysis

## Overview
The MCP Hub is the frontend for the Slash / MCP project, serving as an integration platform and marketplace for AI-powered developer tools. It focuses on free and open tools, multi-account management, and Model Context Protocol (MCP) support.

## Key Features:
*   **Authentication:** Google OAuth via Supabase.
*   **Integrations:** Multi-account support for GitHub, Google Drive, Gmail, Zapier, and LLMs (OpenAI, Anthropic, Gemini). Each provider has a management panel for adding/removing accounts and managing API keys.
*   **Multi-Account Management:** Add, select, and remove multiple accounts per provider, with active account selection for API calls.
*   **AI/LLM Integration:** ChatBar supports OpenAI, Anthropic, and Gemini. Command routing allows both slash commands and natural language queries.
*   **Command Dropdowns:** Each provider panel includes a comprehensive dropdown of available commands with autofill and "Run" support for the ChatBar.
*   **Gallery as Main Interaction Point:** Central place for users to manage integrations, API keys, and accounts.
*   **Security:** API keys stored securely in Supabase with RLS, with optional encryption for production.
*   **Modern UI/UX:** Responsive, accessible, and minimal design with dark/light mode support.
*   **MCP Focus:** Designed for MCP server/client support, with plans for MCP server discovery, command routing, and a centralized MCP marketplace.

## Technical Stack:
*   **Frontend:** React, TypeScript, Tailwind CSS.
*   **Backend:** Supabase (Postgres, Auth, Storage).
*   **Integrations:** REST APIs for GitHub, Google Drive, Gmail, Zapier.
*   **AI/LLM:** OpenAI, Anthropic, Google Gemini (pluggable).
*   **Deployment:** Vercel/Netlify or similar (optional).

## Setup Instructions:
1.  `npm install` or `yarn install`
2.  `npm run dev` or `yarn dev`

## Latest Updates (July 2025):
*   **Google OAuth auto-refresh:** Browser silently renews Google `provider_token` and stores it in `localStorage.googleToken`.
*   **GitHub credential fallback:** UI fetches Personal-Access-Token from Supabase (`user_credentials`) when not found in `localStorage`.
*   **Native GitHub MCP micro-service:** `backend/providers/github.js` handles `list-repos`, `get-issues`, `create-issue`.
*   **Pretty-print results:** Smart-Chat turns arrays returned by MCP into tidy numbered lists.

## Changelog / Latest Updates (June 2025):
*   All LLM providers (OpenAI, Anthropic, Gemini) now route through the backend for chat and key validation.
*   "Run a Command" section removed for cleaner UI.
*   "Test Key" button in each portal now accurately validates keys.
*   API keys never sent directly from frontend to LLM providers; all requests proxied through backend.
*   MCP Server Configuration: Ensure Supabase `mcp_servers` table has correct `apiurl` entries.
*   Multi-Account Management: Add, remove, and set active accounts for each provider.

## Product Requirements (Updated, June 2024):
*   **Authentication:** Google OAuth via Supabase working.
*   **Integrations:** UI for OpenAI, Anthropic, Gemini, GitHub, Google Drive, and Gmail present. Provider portals allow API key/token entry.
*   **Multi-Account Management:** UI supports multiple accounts per provider, but single-token logic is currently reliable.
*   **AI/LLM Integration:** ChatBar supports slash commands and natural language.
*   **Command Routing:** `/drive` and `/gmail` commands route to MCP servers using Supabase session token.
*   **Provider Portal:** Some portals (GitHub, OpenAI) have token save issues.
*   **Command History:** Up/down arrow navigation implemented in ChatBar.
*   **MCP Server Discovery:** Relies on `mcp_servers` table in Supabase.

## Known Issues:
*   Token persistence in provider portals (especially GitHub).
*   MCP server lookup errors.
*   Supabase's Google access token expiry.
*   Missing/unclear UI/UX status/error messages.
*   Some commands still routed to OpenAI by default if MCP server lookup fails.

## Next Steps (for Manus):
1.  **Provider plug-ins:** Each new provider lives in `backend/providers/*.js`.
2.  **Workflow engine:** Roadmap item: chain multi-step plans in the back-end.
3.  **Realtime credential sync:** Consider enabling Supabase Realtime on `user_credentials`.
4.  **Production readiness:** Move gateway + providers to Docker images; use Fly.io or Render; add rate-limit middleware.
5.  **DX:** Add a `npm run dev:all` script.

## Testing Checklist:
*   Add and save tokens for all providers; confirm persistence.
*   Run `/drive` and `/gmail` commands; confirm routing and token usage.
*   Remove and re-add tokens; confirm UI and command routing update.
*   Add/Remove MCP server entries in Supabase; confirm error handling.
*   Test command history navigation and styling.

