# MCP Server GitHub Repository Analysis

## Overview
The MCP Server is a unified backend service for the Model Context Protocol (MCP), enabling API-driven, multi-provider AI and automation command execution, workflow chaining, and seamless integration with services like GitHub and Google. It acts as the core engine for orchestrating commands and workflows across apps and protocols.

## Key Features:
*   **API-driven multi-provider AI chat:** Supports OpenAI, Anthropic, Gemini with per-user API keys.
*   **Command registry:** Includes chat, summarize, code search, repo summary, explain, translate, and more.
*   **Integrations:** Google Drive, Gmail, and GitHub via OAuth or token-based credentials.
*   **Smart intent parsing:** Routes natural language commands to the correct provider or integration.
*   **Chained commands:** Allows multi-step instructions in one message (e.g., "Summarize this PDF and translate to Spanish").
*   **Workflow builder (optional):** Visual builder for multi-step, multi-provider workflows.
*   **File upload:** Summarize or process uploaded files.
*   **Session-based authentication:** Secure, per-user integration tokens.

## Technical Stack:
*   **Backend:** Node.js (Express, ES modules), AI Providers (OpenAI, Anthropic, Google Generative AI), Integrations (Google OAuth, GitHub token-based), Session management (express-session), Database (SQLite for per-user integration tokens), Security (CORS, dotenv, multer).
*   **Frontend (Admin/Optional):** React 18 (TypeScript), Vite, Tailwind CSS (dark mode), Custom UI components, lucide-react icons, State management with custom React hooks.

## API Endpoints:
*   `/api/chat`
*   `/api/workflow`
*   `/api/github`
*   `/api/google`
*   `/api/health`

## Security & Best Practices:
*   TypeScript usage.
*   Tailwind CSS for responsive design.
*   OAuth for secure integrations.
*   Environment variables for secrets/config.
*   API error handling.
*   CORS restricted to local dev ports.
*   Per-user token storage in SQLite.

## Future Enhancements:
*   Visual workflow builder.
*   More integrations (Notion, Slack, Jira, etc.).
*   Custom command macros and user-defined workflows.
*   Scheduling and automation.
*   Contextual memory and chaining across sessions.
*   Harden OAuth flows, encrypt API keys, audit CORS.
*   Add unit and integration tests.

## Setup Instructions:
1.  `pnpm install` (or `npm i`)
2.  `npm run dev` (front-end)
3.  `node backend/index.js` (backend)
4.  Set environment variables: `ENCRYPTION_KEY`, `CORS_ORIGINS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
5.  For local Google testing, add `http://localhost:3001/auth/google/callback` to OAuth client redirect URIs and enable Drive, Gmail, Calendar APIs.

## Multi-step / Chained Examples:
*   "List my last 2 GitHub repos then summarize the most active one"
*   "Get README of sentilabs01/alexa; summarize it; generate an issue titled 'Documentation improvements' in the same repo"
*   "Fetch today's Gmail inbox, summarize messages, and translate the summary to Spanish"
*   "List files in Google Drive folder Docs and summarize each one"
*   "Extract text from the attached image then run sentiment analysis"
*   "Summarize this PDF and email the summary to my team"
*   "Translate the attached CSV to Japanese and upload it back to Google Drive"
*   "List AI-enabled Zaps and trigger Zap 12345"
*   "Run code search for 'useEffect cleanup' in sentilabs01/alexa then summarize the findings"

These are suggestions; the intent parser is lenient. If a step maps to an integration (GitHub, Gmail, Google Drive, Zapier, etc.) MCP routes it automatically; otherwise it treats it as an AI prompt.

