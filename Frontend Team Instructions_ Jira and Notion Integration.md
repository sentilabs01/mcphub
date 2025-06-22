# Frontend Team Instructions: Jira and Notion Integration

This document outlines the responsibilities and implementation steps for the `mcphub` (frontend) team regarding the integration of Jira and Notion into the MCP Messenger app. The core principle is to leverage the `mcpserver` for all API interactions and token management, adhering to an MCP-first ethos.

## 1. Overview of Frontend Responsibilities

The frontend's primary role is to:

*   **Initiate Authentication Flows:** Redirect users to Jira and Notion's OAuth consent screens.
*   **Handle Callbacks:** Process the authorization codes received from Jira and Notion and forward them to the `mcpserver`.
*   **Request Data/Perform Actions via `mcpserver`:** All requests to Jira and Notion APIs will be proxied through the `mcpserver`.
*   **Display UI for Integrations:** Create user interfaces for configuring integrations, displaying data from Jira/Notion, and allowing users to perform actions.
*   **Handle Token-Related UI/UX:** Provide clear feedback to users regarding authentication status and guide them through re-authentication if necessary.

## 2. Key Changes and Areas of Focus

### 2.1. Authentication Flow Integration

#### Jira (OAuth 2.0 (3LO))

1.  **User Action:** When a user wants to connect their Jira account, trigger a redirection to the Atlassian authorization URL. The `client_id`, `scope`, `redirect_uri`, and `state` parameters will need to be dynamically generated or retrieved from `mcpserver` configuration endpoints.
    *   **Example Redirection (Conceptual):**
        ```javascript
        const jiraAuthUrl = await mcpServerService.getJiraAuthUrl(); // New endpoint on mcpserver
        window.location.href = jiraAuthUrl;
        ```
2.  **Callback Handling:** Create a new route/component in `mcphub` (e.g., `/auth/jira/callback`) to handle the redirect from Atlassian. This route will receive the `code` and `state` query parameters.
3.  **Forward to `mcpserver`:** Extract the `code` and `state` and send them to a new `mcpserver` endpoint responsible for exchanging the authorization code for access/refresh tokens.
    *   **Example Callback Logic (Conceptual):**
        ```javascript
        // In /auth/jira/callback component
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
            await mcpServerService.exchangeJiraCodeForToken(code, state);
            // Redirect user back to main app or integration settings
        } else {
            // Handle error or user denial
        }
        ```

#### Notion (OAuth)

1.  **User Action:** Similar to Jira, when a user wants to connect their Notion account, trigger a redirection to the Notion authorization URL.
    *   **Example Redirection (Conceptual):**
        ```javascript
        const notionAuthUrl = await mcpServerService.getNotionAuthUrl(); // New endpoint on mcpserver
        window.location.href = notionAuthUrl;
        ```
2.  **Callback Handling:** Create a new route/component in `mcphub` (e.g., `/auth/notion/callback`) to handle the redirect from Notion. This route will receive the `code` and `state` query parameters.
3.  **Forward to `mcpserver`:** Extract the `code` and `state` and send them to a new `mcpserver` endpoint responsible for exchanging the authorization code for access/refresh tokens.
    *   **Example Callback Logic (Conceptual):**
        ```javascript
        // In /auth/notion/callback component
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
            await mcpServerService.exchangeNotionCodeForToken(code, state);
            // Redirect user back to main app or integration settings
        } else {
            // Handle error or user denial
        }
        ```

### 2.2. API Interaction via `mcpserver`

Instead of making direct API calls to Jira or Notion, `mcphub` will interact with new `mcpserver` endpoints that proxy these requests. This aligns with the MCP-first strategy and offloads token management to the backend.

*   **New `mcpServerService` Methods:** Extend `src/services/mcpServerService.ts` with methods like `callJiraApi(endpoint, data)`, `callNotionApi(endpoint, data)`, etc.
*   **Example (Conceptual):**
    ```javascript
    // Instead of direct Jira API call:
    // const issues = await fetch('https://api.atlassian.com/...', { headers: { Authorization: `Bearer ${jiraToken}` } });

    // Use mcpserver proxy:
    const issues = await mcpServerService.callJiraApi('/rest/api/3/search', { jql: 'status = Open' });
    ```

### 2.3. User Interface (UI) Development

*   **Integration Settings:** Create UI elements for users to initiate the Jira and Notion integration processes (e.g., "Connect Jira," "Connect Notion" buttons).
*   **Status Display:** Show the current connection status (e.g., "Connected to Jira," "Not Connected").
*   **Data Display:** Design components to display data retrieved from Jira (e.g., issue lists, project details) and Notion (e.g., database entries, page content).
*   **Action Triggers:** Implement UI elements (buttons, forms) that allow users to perform actions (e.g., "Create Jira Issue," "Add Notion Page") which will trigger corresponding calls to `mcpserver`.
*   **Error Messages:** Display user-friendly error messages, especially for authentication failures or API errors returned by `mcpserver`.

### 2.4. Token Persistence UI/UX

Since token management is handled by `mcpserver`, the frontend's role is to reflect the authentication status and guide the user if re-authentication is required.

*   **No Local Token Storage:** `mcphub` should **not** store long-lived Jira or Notion tokens in `localStorage` or similar client-side storage.
*   **Session-Based Interaction:** Rely on the `mcpserver` to manage the persistent tokens. If an `mcpserver` API call returns an authentication error, prompt the user to re-initiate the OAuth flow.

## 3. Implementation Steps (High-Level)

1.  **Define `mcpserver` Endpoints:** Collaborate with the backend team to define the necessary `mcpserver` endpoints for:
    *   Initiating OAuth flows (providing `client_id`, `redirect_uri`, etc.).
    *   Exchanging authorization codes for tokens.
    *   Proxying Jira and Notion API requests.
    *   Checking integration status.
2.  **Update `mcpServerService.ts`:** Add new functions to interact with these `mcpserver` endpoints.
3.  **Create Authentication Callback Routes:** Implement `/auth/jira/callback` and `/auth/notion/callback` routes.
4.  **Develop UI Components:** Build the necessary UI for integration settings, data display, and action triggers.
5.  **Integrate UI with `mcpServerService`:** Connect UI actions to the new `mcpServerService` methods.
6.  **Testing:** Thoroughly test the authentication flows, data retrieval, and action execution for both Jira and Notion integrations.

This approach ensures a secure, scalable, and MCP-aligned integration for Jira and Notion.

