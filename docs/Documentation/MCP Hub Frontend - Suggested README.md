# MCP Hub Frontend - Suggested README.md

## Overview

Slash / MCP is an integration platform and marketplace for AI-powered developer tools, focused on free and open tools, multi-account management, and Model Context Protocol (MCP) support. The platform features a modern gallery UI, an always-on AI ChatBar (supporting OpenAI, Anthropic, Gemini), secure API key management (via Supabase), and command dropdowns for each provider.

## Key Features

- **Authentication:** Google OAuth via Supabase.
- **Integrations:** Multi-account support for GitHub, Google Drive, Gmail, Zapier, and LLMs (OpenAI, Anthropic, Gemini). Each provider has a management panel for adding/removing accounts and managing API keys.
- **Multi-Account Management:** Add, select, and remove multiple accounts per provider, with active account selection for API calls.
- **AI/LLM Integration:** ChatBar supports OpenAI, Anthropic (via a Node/Express proxy for CORS/security), and Gemini. Command routing allows both slash commands and natural language queries.
- **Command Dropdowns:** Each provider panel includes a comprehensive dropdown of available commands (chat, integration actions, etc.), with autofill and "Run" support for the ChatBar.
- **Gallery as Main Interaction Point:** The gallery is the central place for users to manage integrations, API keys, and accounts. API key management is handled per provider—no global ChatBar API key field.
- **Security:** API keys are stored securely in Supabase with RLS, and optional encryption is discussed for production readiness.
- **Modern UI/UX:** Responsive, accessible, and minimal design inspired by Obsidian. Dark/light mode support.
- **Branding:** Footer displays 'automationalien.com' in Orbitron font.
- **MCP Focus:** Designed for MCP server/client support, with plans for MCP server discovery, command routing, and a centralized MCP marketplace.

## Technical Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Integrations:** REST APIs for GitHub, Google Drive, Gmail, Zapier
- **AI/LLM:** OpenAI, Anthropic, Google Gemini (pluggable)
- **Deployment:** Vercel/Netlify or similar (optional)

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

```bash
npm install
# or
yarn install
```

### Running the App

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173` by default.

## Usage

- Sign in with Google to access the marketplace and manage integrations.
- Use the gallery to add/manage multiple accounts per provider and securely store API keys.
- Use the ChatBar for natural language or slash command actions across providers (API keys are sourced from the active account in each provider portal).
- Use command dropdowns in each provider panel for quick actions.

## AI/LLM Model Context Protocol

- All AI/LLM servers implement a standard protocol for context exchange:
  - **Request:** `{ prompt: string, context: object, metadata: object }`
  - **Response:** `{ output: string, tokens_used: number, model_version: string, ... }`
- Ensures secure, auditable, and consistent LLM interactions.

## Latest Updates (July 2025)

- **Google OAuth auto-refresh** is now baked into `useAuth`. The browser silently renews the Google `provider_token` two minutes before expiry and stores the fresh token in `localStorage.googleToken`. Drive/Gmail commands never break.
- **GitHub credential fallback**: the UI now fetches the Personal-Access-Token from Supabase (`user_credentials`) when not found in `localStorage`, so multi-device sessions Just Work™.
- **Native GitHub MCP micro-service**: `backend/providers/github.js` handles `list-repos`, `get-issues`, `create-issue`. Supabase `mcp_servers.id = 'github'` already points to `http://localhost:3001/api` – no code change needed in the front-end.
- **Pretty-print results**: Smart-Chat turns arrays returned by MCP into tidy numbered lists (repos, Drive files, Gmail messages). Placeholders are now summarised instead of dumping raw JSON.
- **All LLM providers (OpenAI, Anthropic, Gemini) now route through the backend for chat and key validation.**
- **Provider portals:** The "Run a Command" section has been removed for a cleaner, less confusing UI.
- **API Key Testing:** The "Test Key" button in each portal now accurately validates keys for all providers and displays success/failure.
- **Security:** API keys are never sent directly from the frontend to LLM providers; all requests are proxied through the backend.
- **MCP Server Configuration:** Ensure your Supabase `mcp_servers` table has correct `apiurl` entries for each provider (e.g., `http://localhost:3001/api`).
- **Multi-Account Management:** Add, remove, and set active accounts for each provider; the active account's key is used for all API calls.

## Architecture Overview

This app is a multi-provider LLM/AI hub with:
- Google OAuth authentication
- Dark mode
- Provider integrations (OpenAI, Google Drive, Gmail, GitHub, etc.)
- ChatBar for sending MCP commands
- Per-provider portal modals for account management and command discovery

### Main Components

- **AuthProvider / useAuth**: Handles user authentication and session.
- **GoogleOAuthProvider**: Provides Google OAuth context for Drive/Gmail.
- **MinimalAppContent**: Main app logic (auth, dark mode, chat, integrations).
- **ChatBar**: Main chat interface for MCP commands.
- **IntegrationsGallery**: Shows available providers.
- **ProviderPortalModal**: Per-provider portal for account connection and commands.
- **Integrations**: Provider-specific integrations UI.
- **Context Providers**: For chat input and marketplace search.

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## Roadmap

- [ ] Debug and polish provider command dropdowns and account scanning
- [ ] Implement real backend for server installation and management
- [ ] Integrate live AI/LLM providers (OpenAI, Anthropic, etc.)
- [ ] Finalize and document the model context protocol
- [ ] Add billing and premium server support
- [ ] Expand analytics and audit logging
- [ ] Expand gallery and provider integrations

## License
MIT

For questions or support, contact [Senti Labs](https://sentilabs.com)


