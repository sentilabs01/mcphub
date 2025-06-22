# GitHub - sentilabs01/mcphub: MPC Hub frontend

## 🚀 July 2025 Update – MCP Routing & Credential Quality-of-Life

*   **Google OAuth auto-refresh** is now baked into `useAuth`. The browser silently renews the Google `provider_token` two minutes before expiry and stores the fresh token in `localStorage.googleToken`. Drive/Gmail commands never break.
*   **GitHub credential fallback**: the UI now fetches the Personal-Access-Token from Supabase (`user_credentials`) when not found in `localStorage`, so multi-device sessions Just Work™.
*   **Native GitHub MCP micro-service**: `backend/providers/github.js` handles `list-repos`, `get-issues`, `create-issue`. Supabase `mcp_servers.id = 'github'` already points to `http://localhost:3001/api` – no code change needed in the front-end.
*   **Google Calendar integration (read & write)**: ChatBar now supports `/calendar` commands through the MCP server. Full token scopes are requested automatically and events are displayed via pretty-print.
*   **Pretty-print results**: Smart-Chat formats arrays from MCP into tidy numbered lists (repos, Drive files, Gmail/GCal items) instead of raw JSON.

### New this week (June 20-25)

*   **Slack natural-language commands** – backend now handles
    *   `list channels` / `channels`
    *   `send #general hello world`
    *   `get messages #general 10` so the UI no longer shows _Unsupported Slack command_ when the correct `xoxb-` token is present.
*   **Persistent Google OAuth** – a shared refresh-token is stored in `user_integration_accounts (provider = 'google', account_label = 'default')` and a new `/api/google/token` endpoint hands out fresh access-tokens. Front-end helper `fetchGoogleAccessToken()` caches the token in `localStorage.google_access_token`, so Drive / Gmail / Calendar commands survive page reloads and new tabs.

### 👋 A note for Manus (next-phase lead)

1.  **Provider plug-ins** ‑ Each new provider lives in `backend/providers/*.js` (see `github.js` for the template). Expose `{ id, supportedCommands, executeCommand }` and the gateway auto-loads it.
2.  **Workflow engine** ‑ Roadmap item: chain multi-step plans (`plan.steps`) in the back-end so front-end simply posts a plan ID.
3.  **Realtime credential sync** ‑ Consider enabling Supabase Realtime on `user_credentials` to push token changes to all open tabs.
4.  **Production readiness** ‑ Move gateway + providers to Docker images; use Fly.io or Render for zero-ops deploy; add rate-limit middleware.
5.  **DX** ‑ Add a `npm run dev:all` script that launches Vite + MCP gateway + providers concurrently via `npm-run-all`.

> Feel free to ping @senti-labs/ai-hub if anything is unclear—let's keep velocity high! 🌟

## Changelog / Latest Updates (June 2025)

*   **All LLM providers (OpenAI, Anthropic, Gemini) now route through the backend for chat and key validation.**
*   **Provider portals:** The "Run a Command" section has been removed for a cleaner, less confusing UI.
*   **API Key Testing:** The "Test Key" button in each portal now accurately validates keys for all providers and displays success/failure.
*   **Security:** API keys are never sent directly from the frontend to LLM providers; all requests are proxied through the backend.
*   **MCP Server Configuration:** Ensure your Supabase `mcp_servers` table has correct `apiurl` entries for each provider (e.g., `http://localhost:3001/api`).
*   **Multi-Account Management:** Add, remove, and set active accounts for each provider; the active account's key is used for all API calls.

## Product Requirements (Updated, June 2024)

*   **Authentication:** Google OAuth via Supabase is working for app login and Google integrations.
*   **Integrations:** UI for OpenAI, Anthropic, Gemini, GitHub, Google Drive, and Gmail is present. Provider portals allow API key/token entry, but some tokens (notably GitHub) are not reliably saved to localStorage.
*   **Multi-Account Management:** UI supports multiple accounts per provider, but only single-token logic is currently reliable. "Active" account logic is not fully robust.
*   **AI/LLM Integration:** ChatBar supports slash commands and natural language, but command routing to MCP servers is still being debugged for some providers.
*   **Command Routing:** `/drive` and `/gmail` commands now route to MCP servers using the Supabase session token, but require correct MCP server entries in Supabase and valid tokens.
*   **Provider Portal:** Some portals (GitHub, OpenAI) have token save issues; UI may show "Saved" but not persist to localStorage.
*   **Command History:** Up/down arrow navigation is implemented in the ChatBar, with improved styling for both dark and light modes.
*   **MCP Server Discovery:** Relies on the `mcp_servers` table in Supabase; errors occur if entries are missing or duplicated.

* * *

*   **Token Persistence:** Some provider portals (notably GitHub) do not reliably save tokens to localStorage, causing command failures.
*   **MCP Server Lookup:** Commands fail if the `mcp_servers` table is missing the correct provider entry or if there are duplicate/incorrect rows.
*   **Session Token Expiry:** Supabase's Google access token (`provider_token`) may expire or be missing after page reload; robust token refresh is not yet implemented.
*   **UI/UX:** Some status/error messages are missing or unclear; account management UI is "coming soon" for some providers.
*   **Command Routing:** Some commands are still routed to OpenAI by default if MCP server lookup fails.

* * *

1.  **Fix token persistence in provider portals** (ensure tokens are reliably saved and loaded from localStorage).
2.  **Improve MCP server discovery and error handling** (clearer errors, auto-heal for missing/duplicate entries).
3.  **Implement robust token refresh for Google integrations** (backend or frontend).
4.  **Polish account management UI** (multi-account, active account selection, error/status display).
5.  **Expand and document MCP protocol and server integration.**
6.  **Add more provider integrations and polish command dropdowns.**

* * *

### **Testing Checklist (Updated)**

*    Add and save tokens for all providers; confirm they persist in localStorage.
*    Run `/drive` and `/gmail` commands; confirm they route to MCP server and use the correct token.
*    Remove and re-add tokens; confirm UI and command routing update accordingly.
*    Add/Remove MCP server entries in Supabase; confirm error handling in the UI.
*    Test command history navigation and styling in both dark and light modes.

* * *

*   See the original Contributing section below.

Slash / MCP is an integration platform and marketplace for AI-powered developer tools, focused on free and open tools, multi-account management, and Model Context Protocol (MCP) support. The platform features a modern gallery UI, always-on AI ChatBar (supporting OpenAI, Anthropic, Gemini), secure API key management (via Supabase), and command dropdowns for each provider.

* * *

*   **Authentication:** Google OAuth via Supabase.
*   **Integrations:** Multi-account support for GitHub, Google Drive, Gmail, Zapier, and LLMs (OpenAI, Anthropic, Gemini). Each provider has a management panel for adding/removing accounts and managing API keys.
*   **Multi-Account Management:** Add, select, and remove multiple accounts per provider, with active account selection for API calls.
*   **AI/LLM Integration:** ChatBar supports OpenAI, Anthropic (via a Node/Express proxy for CORS/security), and Gemini. Command routing allows both slash commands and natural language queries.
*   **Command Dropdowns:** Each provider panel includes a comprehensive dropdown of available commands (chat, integration actions, etc.), with autofill and "Run" support for the ChatBar.
*   **Gallery as Main Interaction Point:** The gallery is the central place for users to manage integrations, API keys, and accounts. API key management is handled per provider—no global ChatBar API key field.
*   **Security:** API keys are stored securely in Supabase and never sent directly from the frontend to LLM providers. All requests are proxied through the backend.
*   **MCP Server Discovery:** MCP servers are discovered via the `mcp_servers` table in Supabase, allowing dynamic integration of new services.
*   **Extensibility:** New providers can be added as plug-ins in the backend, exposing their supported commands and execution logic.
*   **Scalability:** The architecture supports routing all LLM providers through the backend for chat and key validation, enabling centralized management and security.
*   **User Experience:** The UI is designed for a cleaner experience, with features like pretty-print results and command history navigation.

* * *

## Contributing

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v8 or higher)
*   Supabase account and project

### Setup

1.  Clone the repository:

    ```bash
    git clone https://github.com/sentilabs01/mcphub.git
    cd mcphub
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Configure Supabase:

    *   Create a new Supabase project.
    *   Get your Supabase URL and `anon` key from Project Settings -> API.
    *   Set up your database schema (see `supabase/schema.sql` for details).
    *   Update `.env.local` with your Supabase credentials:

        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

4.  Run the development server:

    ```bash
    npm run dev
    ```

    The app will be running at `http://localhost:5173`.

### Project Structure

*   `src/`: Frontend source code (React, TypeScript)
*   `public/`: Static assets
*   `supabase/`: Supabase schema and migrations
*   `backend/`: MCP server backend (Node.js, Express)

### Key Files

*   `src/App.tsx`: Main application component
*   `src/components/ChatBar.tsx`: ChatBar component for AI interaction
*   `src/components/ProviderPortals.tsx`: Components for managing provider integrations
*   `backend/server.js`: MCP server entry point
*   `backend/providers/`: Directory for MCP provider plug-ins

### Adding a New Provider

1.  Create a new file in `backend/providers/` (e.g., `backend/providers/myprovider.js`).
2.  Implement the `id`, `supportedCommands`, and `executeCommand` functions.
3.  Add the provider to the `mcp_servers` table in your Supabase database.

### Testing

*   Run unit tests:

    ```bash
    npm test
    ```

*   Run end-to-end tests (Cypress):

    ```bash
    npm run cypress:open
    ```

## License

This project is licensed under the MIT License.


