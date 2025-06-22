# Frontend Team Instructions: Jira Integration

**Date: 2025-06-21**

This document outlines the responsibilities and implementation steps for the `mcphub` (frontend) team regarding the integration of Jira into the MCP Messenger app. The core principle is to provide a seamless user experience while leveraging the `mcpserver` (backend) as the central hub for all Jira API interactions and credential management. The frontend will focus on initiating OAuth flows, sending MCP commands, and displaying responses.

## 1. Overview of Frontend Responsibilities

The frontend's primary role is to:

*   **Initiate OAuth Flows:** Guide users through the Jira OAuth 2.0 (3LO) authorization process by calling backend endpoints.
*   **Send MCP Commands:** Transmit user-initiated Jira commands (via the ChatBar) to the `mcpserver`.
*   **Display Responses:** Render Jira-related information and command results received from the backend in a user-friendly format.
*   **Manage UI State:** Reflect the integration status (e.g., connected, disconnected, error) and provide appropriate user feedback.

## 2. Key Changes and Areas of Focus

### 2.1. User Interface (UI) Enhancements

#### 2.1.1. Jira Integration Section

Create a dedicated section within the `mcphub` UI for Jira integration. This section should be similar in structure and functionality to existing provider portals (e.g., Google, GitHub, OpenAI) and include:

*   **


Connect Jira" button:** A prominent button that initiates the Jira OAuth flow.
*   **Integration Status Display:** Clear visual indicators (e.g., 


connected/disconnected status, error messages) to inform the user about the state of their Jira integration.
*   **Account Management:** If applicable, provide options for users to manage multiple Jira accounts or disconnect their integration.

#### 2.1.2. ChatBar Integration

Enhance the existing ChatBar component to recognize and handle Jira-specific MCP commands. This will involve:

*   **Command Recognition:** Implement logic to identify commands prefixed with `/jira` (e.g., `/jira create issue`, `/jira list issues`).
*   **Parameter Extraction:** Extract relevant parameters from the user's command (e.g., issue summary, description, project key).
*   **Command Transmission:** Send the parsed Jira command and its parameters to the `mcpserver` for processing. This will likely involve making a `POST` request to a designated backend endpoint (e.g., `/api/command` or a new `/api/jira/command` endpoint).

### 2.2. OAuth Flow Initiation

The frontend is responsible for initiating the Jira OAuth 2.0 (3LO) flow and redirecting the user to the Atlassian authorization page.

1.  **User Action:** When the user clicks the "Connect Jira" button in the UI, trigger a function to initiate the OAuth process.
2.  **Request Authorization URL from Backend:** Make an asynchronous request (e.g., using `fetch` or `axios`) to the `mcpserver`'s Jira OAuth endpoint (e.g., `GET /api/auth/jira/url`). This endpoint will return the Atlassian authorization URL.
    ```javascript
    // Example frontend code (conceptual)
    async function initiateJiraOAuth() {
        try {
            const response = await fetch('/api/auth/jira/url');
            const data = await response.json();
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl; // Redirect user to Atlassian
            } else {
                // Handle error: authorization URL not returned
                console.error('Failed to get Jira authorization URL:', data.error);
                // Display error to user
            }
        } catch (error) {
            console.error('Error initiating Jira OAuth:', error);
            // Display error to user
        }
    }
    ```
3.  **Redirect User:** Upon receiving the `authorizationUrl` from the backend, redirect the user's browser to this URL. The user will then be prompted by Atlassian to grant permissions to the MCP Messenger app.

### 2.3. Communication with `mcpserver`

All interactions with Jira will be proxied through the `mcpserver`. The frontend will send commands and receive responses from the backend, without directly interacting with Jira APIs.

#### 2.3.1. Sending Jira Commands

When a user enters a Jira-related command in the ChatBar, the frontend will package this command and send it to the `mcpserver`.

*   **Endpoint:** Use a dedicated endpoint on the `mcpserver` for processing MCP commands (e.g., `POST /api/command` or `POST /api/jira/command`).
*   **Payload:** The request payload should include the MCP command string and any extracted parameters. The backend will be responsible for parsing this command, retrieving the user's Jira credentials, making the appropriate Jira API calls, and formatting the response.
    ```javascript
    // Example frontend code for sending a Jira command (conceptual)
    async function sendJiraCommand(commandText) {
        try {
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: commandText, provider: 'jira' }), // Include provider for backend routing
            });
            const result = await response.json();
            // Process and display the result
            console.log('Jira command result:', result);
            // Update UI with result
        } catch (error) {
            console.error('Error sending Jira command:', error);
            // Display error to user
        }
    }
    ```

#### 2.3.2. Displaying Jira Responses

The frontend will receive processed responses from the `mcpserver` (which has already interacted with Jira and formatted the data). These responses should be displayed to the user in a clear and intuitive manner.

*   **Parsing Responses:** Implement logic to parse the structured responses received from the backend.
*   **Rich Display:** Utilize existing UI components (e.g., for displaying lists, tables, or formatted text) to present Jira issues, project lists, or other relevant information.
*   **Error Handling:** Clearly display any error messages received from the backend, guiding the user on how to resolve issues.

## 3. Credential Management and Google OAuth Integration

*   **No Direct Credential Handling:** The frontend will **not** directly handle Jira API keys, access tokens, or refresh tokens. All sensitive credential management is delegated to the `mcpserver`.
*   **Persistent Google OAuth:** The existing Google OAuth integration will remain the primary sign-in method. Jira integration is an add-on service. The frontend should continue to leverage the `useAuth` hook and `localStorage.googleToken` for persistent Google credentials.
*   **`useToken` Hook:** The `useToken` hook (or a similar mechanism) should be adapted to retrieve Jira-specific tokens from the backend when needed for display purposes (e.g., to show if a user is connected to Jira), but not for direct API calls.

## 4. Implementation Steps (High-Level)

1.  **UI Development:** Create the Jira integration section and enhance the ChatBar.
2.  **OAuth Flow Integration:** Implement the frontend logic to initiate the OAuth flow and handle redirects.
3.  **Command Sending:** Develop functions to send Jira-related MCP commands to the backend.
4.  **Response Display:** Implement logic to parse and display responses from the backend.
5.  **Testing:** Thoroughly test the UI, OAuth flow, command sending, and response display.

This document provides a high-level overview for the frontend team. Detailed API specifications for backend endpoints will be provided separately.

