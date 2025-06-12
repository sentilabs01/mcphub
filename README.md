# AI Hub

## Changelog / Latest Updates (June 2024)

- **All LLM providers (OpenAI, Anthropic, Gemini) now route through the backend for chat and key validation.**
- **Provider portals:** The "Run a Command" section has been removed for a cleaner, less confusing UI.
- **API Key Testing:** The "Test Key" button in each portal now accurately validates keys for all providers and displays success/failure.
- **Security:** API keys are never sent directly from the frontend to LLM providers; all requests are proxied through the backend.
- **MCP Server Configuration:** Ensure your Supabase `mcp_servers` table has correct `apiurl` entries for each provider (e.g., `http://localhost:3001/api`).
- **Multi-Account Management:** Add, remove, and set active accounts for each provider; the active account's key is used for all API calls.

## Product Requirements (Updated, June 2024)

### **Current State**
- **Authentication:** Google OAuth via Supabase is working for app login and Google integrations.
- **Integrations:** UI for OpenAI, Anthropic, Gemini, GitHub, Google Drive, and Gmail is present. Provider portals allow API key/token entry, but some tokens (notably GitHub) are not reliably saved to localStorage.
- **Multi-Account Management:** UI supports multiple accounts per provider, but only single-token logic is currently reliable. "Active" account logic is not fully robust.
- **AI/LLM Integration:** ChatBar supports slash commands and natural language, but command routing to MCP servers is still being debugged for some providers.
- **Command Routing:** `/drive` and `/gmail` commands now route to MCP servers using the Supabase session token, but require correct MCP server entries in Supabase and valid tokens.
- **Provider Portal:** Some portals (GitHub, OpenAI) have token save issues; UI may show "Saved" but not persist to localStorage.
- **Command History:** Up/down arrow navigation is implemented in the ChatBar, with improved styling for both dark and light modes.
- **MCP Server Discovery:** Relies on the `mcp_servers` table in Supabase; errors occur if entries are missing or duplicated.

---

### **Known Challenges**
- **Token Persistence:** Some provider portals (notably GitHub) do not reliably save tokens to localStorage, causing command failures.
- **MCP Server Lookup:** Commands fail if the `mcp_servers` table is missing the correct provider entry or if there are duplicate/incorrect rows.
- **Session Token Expiry:** Supabase's Google access token (`provider_token`) may expire or be missing after page reload; robust token refresh is not yet implemented.
- **UI/UX:** Some status/error messages are missing or unclear; account management UI is "coming soon" for some providers.
- **Command Routing:** Some commands are still routed to OpenAI by default if MCP server lookup fails.

---

### **Development Priorities**
1. **Fix token persistence in provider portals** (ensure tokens are reliably saved and loaded from localStorage).
2. **Improve MCP server discovery and error handling** (clearer errors, auto-heal for missing/duplicate entries).
3. **Implement robust token refresh for Google integrations** (backend or frontend).
4. **Polish account management UI** (multi-account, active account selection, error/status display).
5. **Expand and document MCP protocol and server integration.**
6. **Add more provider integrations and polish command dropdowns.**

---

### **Testing Checklist (Updated)**
- [ ] Add and save tokens for all providers; confirm they persist in localStorage.
- [ ] Run `/drive` and `/gmail` commands; confirm they route to MCP server and use the correct token.
- [ ] Remove and re-add tokens; confirm UI and command routing update accordingly.
- [ ] Add/Remove MCP server entries in Supabase; confirm error handling in the UI.
- [ ] Test command history navigation and styling in both dark and light modes.

---

### **How to Contribute**
- See the original Contributing section below.

## Overview
AI Hub is an integration platform and marketplace for AI-powered developer tools, focused on free and open tools, multi-account management, and Model Context Protocol (MCP) support. The platform features a modern gallery UI, always-on AI ChatBar (supporting OpenAI, Anthropic, Gemini), secure API key management (via Supabase), and command dropdowns for each provider.

---

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

---

## Technical Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Integrations:** REST APIs for GitHub, Google Drive, Gmail, Zapier
- **AI/LLM:** OpenAI, Anthropic, Google Gemini (pluggable)
- **Deployment:** Vercel/Netlify or similar (optional)

---

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

---

## Usage
- Sign in with Google to access the marketplace and manage integrations.
- Use the gallery to add/manage multiple accounts per provider and securely store API keys.
- Use the ChatBar for natural language or slash command actions across providers (API keys are sourced from the active account in each provider portal).
- Use command dropdowns in each provider panel for quick actions.

---

## AI/LLM Model Context Protocol
- All AI/LLM servers implement a standard protocol for context exchange:
  - **Request:** `{ prompt: string, context: object, metadata: object }`
  - **Response:** `{ output: string, tokens_used: number, model_version: string, ... }`
- Ensures secure, auditable, and consistent LLM interactions.

---

## Manual Testing Checklist: Multi-Account Management & Integrations

1. **For each provider (OpenAI, Anthropic, Google Drive, Gmail, etc.):**
   - Add multiple accounts/keys.
   - Set different accounts as "Active."
   - Remove accounts and ensure the UI updates.
   - Confirm the "Active" account is used for API calls (check localStorage and network requests).

2. **Edge Cases:**
   - Remove the active account—does another become active, or does the UI prompt you to add/select one?
   - Add an invalid key—does the UI show an error?
   - Switch between providers and ensure the correct account is always active.

---

## Contributing
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## Roadmap
- [ ] Debug and polish provider command dropdowns and account scanning
- [ ] Implement real backend for server installation and management
- [ ] Integrate live AI/LLM providers (OpenAI, Anthropic, etc.)
- [ ] Finalize and document the model context protocol
- [ ] Add billing and premium server support
- [ ] Expand analytics and audit logging
- [ ] Expand gallery and provider integrations

---

## License
MIT

---

For questions or support, contact [Senti Labs](https://sentilabs.com) 