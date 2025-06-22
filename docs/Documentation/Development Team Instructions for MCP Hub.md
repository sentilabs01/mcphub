# Development Team Instructions for MCP Hub

## To the Frontend Development Team (MCP Hub)

This document provides an overview of the MCP Hub frontend, its architecture, key features, and development guidelines, primarily based on the `mcphub` GitHub repository. The goal is to ensure a clear understanding of the existing system and facilitate future development.

### 1. Overview of MCP Hub Frontend

The MCP Hub serves as the user interface for the MCP ecosystem, allowing users to interact with the MCP Server, manage integrations, and utilize AI-powered features. It is built using React, TypeScript, and Tailwind CSS, focusing on a modern and responsive user experience.

### 2. Core Technologies and Dependencies

*   **Framework:** React 18 with TypeScript.
*   **Build Tool:** Vite for fast development and optimized builds.
*   **Styling:** Tailwind CSS for utility-first styling, with dark mode support.
*   **Icons:** `lucide-react` for UI icons.
*   **State Management:** Primarily custom React hooks. Evaluate if a more centralized state management solution (e.g., Redux, Zustand) is needed as complexity grows.
*   **Backend Interaction:** Communicates with the MCP Server for all AI and integration-related functionalities. All LLM requests are proxied through the backend.
*   **Authentication/Data Storage:** Supabase (Postgres, Auth, Storage) for user authentication and storing certain user-specific data (e.g., `user_credentials`, `mcp_servers` table).

### 3. Key Features and Functionality

*   **Google OAuth Auto-refresh:** The `useAuth` hook handles silent renewal of Google `provider_token` and stores it in `localStorage.googleToken`. Ensure this mechanism is robust and handles edge cases.
*   **GitHub Credential Fallback:** The UI fetches GitHub Personal Access Tokens from Supabase (`user_credentials`) if not found in `localStorage`, enabling seamless multi-device sessions.
*   **Pretty-print Results:** The Smart-Chat component is responsible for formatting backend responses (e.g., arrays of repos, Drive files, Gmail messages) into user-friendly, readable lists.
*   **API Key Testing:** The frontend provides a mechanism to test API keys for various providers. Ensure this functionality is accurate and provides clear feedback to the user.
*   **Provider Portals:** The UI provides dedicated portals for managing different AI and integration providers. The "Run a Command" section has been removed for a cleaner UI.
*   **Multi-Account Management:** The UI supports adding, removing, and selecting active accounts per provider. While the single-token logic is currently more reliable, future improvements should focus on robust multi-account management.
*   **Command Routing:** The ChatBar supports slash commands and natural language queries. The frontend is responsible for sending these commands to the MCP Server, which then routes them to the appropriate backend provider.
*   **Command History:** The ChatBar includes navigation for command history (up/down arrows) with improved styling.
*   **Gallery as Main Interaction Point:** The gallery serves as the central interface for users to manage integrations, API keys, and accounts.

### 4. Security Considerations for Frontend

*   **No Direct API Key Transmission:** Crucially, API keys are never sent directly from the frontend to LLM providers. All requests must be proxied through the MCP Server backend to ensure security.
*   **Secure Local Storage:** While `localStorage` is used for Google tokens, ensure that sensitive information is handled with care and that tokens are refreshed securely.
*   **Input Validation:** Implement client-side input validation to provide immediate feedback to users and reduce unnecessary requests to the backend.
*   **Error Display:** Provide clear and user-friendly error messages without exposing sensitive backend details.

### 5. Development Environment Setup

To set up your local development environment for MCP Hub:

1.  **Clone the repository:** `git clone https://github.com/sentilabs01/mcphub.git`
2.  **Install dependencies:** Navigate to the project root and run `npm install` (or `yarn install`).
3.  **Run the Frontend:** Execute `npm run dev` (or `yarn dev`). The application will typically be available at `http://localhost:5173`.
4.  **Connect to MCP Server:** Ensure your local MCP Server (`mcpserver`) is running and accessible. The frontend relies on the `mcp_servers` table in Supabase for `apiurl` entries for each provider (e.g., `http://localhost:3001/api`). Verify these configurations are correct for your local setup.

### 6. Interaction with Make MCP Server

While the MCP Hub frontend primarily interacts with the `mcpserver` backend, it's important to understand the role of the Make MCP Server in the broader ecosystem:

*   **Scenario Exposure:** The Make MCP Server exposes Make scenarios as callable tools. The frontend, through the `mcpserver` backend, can trigger these scenarios and receive their outputs.
*   **Token / Scope Requirements:**  Make's current MCP implementation issues tokens with a single, catch-all scope `mcp:use`.  Contrary to earlier drafts, there are **no granular `scenarios:read` or `scenarios:execute` scopes**—a valid token with `mcp:use` is sufficient to execute any scenario that belongs to the same team/workspace as the token.  Please update any onboarding docs, UI copy, or validation logic to reflect this.
*   **User Experience:** The frontend is responsible for presenting these Make-powered capabilities to the user in an intuitive way, allowing them to leverage Make's automation power through the MCP Hub's AI-driven interface.
*   **Configuration:** The frontend might need to display status or configuration related to Make integrations, relying on information provided by the `mcpserver` backend.

### 7. Future Development and Roadmap

Based on the `mcphub` repository's roadmap, consider these areas for future development:

*   **Token Persistence:** Address and fix issues with token persistence in provider portals to ensure tokens are reliably saved and loaded from `localStorage`.
*   **MCP Server Discovery and Error Handling:** Improve the frontend's handling of MCP server discovery, providing clearer error messages and potentially auto-healing mechanisms for missing or duplicate entries in the `mcp_servers` table.
*   **Robust Token Refresh:** Implement more robust token refresh mechanisms for Google integrations, potentially leveraging backend solutions.
*   **Account Management UI:** Refine and polish the multi-account management UI, including active account selection and clear status/error displays.
*   **MCP Protocol and Server Integration:** Continue to expand and document the MCP protocol and server integration from the frontend's perspective.
*   **New Provider Integrations:** Integrate new providers and enhance the command dropdowns for a richer user experience.
*   **Real-time Credential Sync:** Explore enabling Supabase Realtime on `user_credentials` to push token changes to all open tabs, improving multi-device experience.
*   **DX Improvements:** Contribute to developer experience by adding scripts like `npm run dev:all` to concurrently launch Vite, MCP gateway, and providers.


