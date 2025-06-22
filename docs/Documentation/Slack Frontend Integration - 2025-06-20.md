# Slack Frontend Integration - 2025-06-20

This document outlines the necessary frontend changes and considerations for integrating Slack functionality into the MCPHub application. The goal is to provide a seamless user experience for connecting Slack workspaces, configuring notifications, and interacting with MCP commands via Slack.

## 1. Overview of Frontend Integration

The MCPHub frontend, built with React, TypeScript, and Tailwind CSS, will be extended to allow users to:

*   **Connect to Slack Workspaces:** Initiate the OAuth flow to authorize the MCP Slack App for their workspace.
*   **Manage Slack Integrations:** View connected workspaces, configure notification preferences, and potentially manage bot settings.
*   **Display Slack-related Information:** Show status updates or responses from Slack within the MCPHub UI.
*   **Trigger Backend Actions:** Make API calls to the MCPServer to send messages to Slack or manage Slack-related configurations.

## 2. UI/UX Considerations and New Components

To support Slack integration, new UI components and modifications to existing ones will be required. The design should align with the existing modern UI/UX of MCPHub.

### 2.1. Slack Integration Settings Page/Section

A dedicated section within MCPHub settings (e.g., under "Integrations" or a new "Slack" tab) should be created. This page will serve as the central hub for managing Slack connections.

**Key elements for this page:**

*   **"Connect to Slack" Button:** Initiates the Slack OAuth flow. This button will link to an MCPServer endpoint that redirects to Slack's OAuth authorization URL.
*   **List of Connected Workspaces:** Display a list of Slack workspaces that have been integrated with MCPHub. Each entry could show:
    *   Workspace Name/Icon
    *   Connected Bot User Name
    *   Status (e.g., "Connected," "Disconnected")
    *   Options to "Disconnect" or "Configure" the integration.
*   **Notification Preferences:** Allow users to configure which MCP events or command results should be sent to specific Slack channels. This could involve:
    *   Dropdowns to select Slack channels.
    *   Checkboxes for different notification types (e.g., "Command Success," "Command Failure," "New Task Assigned").
*   **Slash Command Reference:** A section providing a quick reference for available Slack slash commands (e.g., `/mcp`) and their usage.

### 2.2. Integration with Existing Components

*   **ChatBar:** While primary interaction with Slack will be via Slack itself, the MCPHub ChatBar could potentially display a history of Slack-initiated commands or responses, or allow users to initiate Slack-bound commands directly from MCPHub (which would then be routed via MCPServer).
*   **Provider Portals:** A new "Slack" provider portal could be added, similar to existing GitHub or Google portals, to manage Slack-specific API keys (though primarily handled by OAuth on the backend) or advanced settings.

## 3. Frontend-Backend Interaction

MCPHub will communicate with MCPServer via its existing API endpoints to manage Slack integration. New endpoints will be needed on the MCPServer side to facilitate this.

### 3.1. Initiating Slack OAuth Flow

When the user clicks "Connect to Slack," MCPHub will redirect the user to an MCPServer endpoint. This endpoint will then redirect to Slack's OAuth authorization URL.

**Frontend Action:**

```typescript
// In your React component (e.g., SlackIntegrationSettings.tsx)
const handleConnectSlack = () => {
  // Redirect to MCPServer endpoint that initiates Slack OAuth
  window.location.href = 
    `${process.env.REACT_APP_MCPSERVER_API_URL}/api/slack/auth`;
};

// In your JSX:
// <button onClick={handleConnectSlack}>Connect to Slack</button>
```

**MCPServer Endpoint (`/api/slack/auth` - simplified conceptual flow):**

```javascript
// This is a conceptual example for MCPServer, not frontend code.
// MCPServer would redirect to Slack's OAuth URL.
// Example: https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=app_mentions:read,chat:write,commands&user_scope=&redirect_uri=YOUR_REDIRECT_URI
```

### 3.2. Handling OAuth Redirect and Callback

After a user authorizes the Slack App, Slack will redirect back to a `redirect_uri` configured in your Slack App settings and handled by MCPServer. MCPServer will then exchange the temporary code for access tokens (`bot_token`, `team_id`, etc.) and store them securely.

**Frontend Action (after successful OAuth):**

Upon successful authorization and token storage by MCPServer, MCPServer should redirect back to a specific MCPHub page (e.g., `/settings/slack?status=success`). MCPHub can then display a success message and refresh the list of connected workspaces.

```typescript
// In your React component (e.g., in a useEffect hook on the settings page)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  if (status === "success") {
    alert("Successfully connected to Slack!");
    // Optionally, fetch updated list of connected workspaces
    fetchConnectedWorkspaces();
  } else if (status === "error") {
    const error = params.get("error");
    alert(`Failed to connect to Slack: ${error}`);
  }
}, []);
```

### 3.3. Managing Slack Configurations (e.g., Notifications)

MCPHub will make API calls to MCPServer to save or update Slack-related configurations, such as notification preferences.

**Frontend Action (Example: Saving Notification Settings):**

```typescript
// In your React component
const handleSaveNotificationSettings = async () => {
  const settings = {
    workspaceId: "T12345", // Selected workspace
    channelId: "C67890",   // Selected channel
    notificationTypes: ["command_success", "command_failure"], // Selected types
  };

  try {
    const response = await fetch(
      `${process.env.REACT_APP_MCPSERVER_API_URL}/api/slack/settings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }
    );
    if (response.ok) {
      alert("Notification settings saved!");
    } else {
      alert("Failed to save settings.");
    }
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("An error occurred.");
  }
};
```

**MCPServer Endpoint (`/api/slack/settings` - conceptual):**

```javascript
// This endpoint would receive the settings, validate them, and store them
// in the database, associating them with the user and workspace.
```

## 4. Displaying Slack-related Information

While most Slack interactions happen within Slack, MCPHub can provide a consolidated view or status updates.

### 4.1. Connected Workspaces List

MCPHub will fetch the list of connected Slack workspaces from MCPServer and display them.

**Frontend Action (Fetching Connected Workspaces):**

```typescript
// In your React component
const [connectedWorkspaces, setConnectedWorkspaces] = useState([]);

const fetchConnectedWorkspaces = async () => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_MCPSERVER_API_URL}/api/slack/workspaces`
    );
    if (response.ok) {
      const data = await response.json();
      setConnectedWorkspaces(data.workspaces);
    } else {
      console.error("Failed to fetch workspaces.");
    }
  } catch (error) {
    console.error("Error fetching workspaces:", error);
  }
};

useEffect(() => {
  fetchConnectedWorkspaces();
}, []);
```

**MCPServer Endpoint (`/api/slack/workspaces` - conceptual):**

```javascript
// This endpoint would query the database for stored Slack workspace tokens
// and return relevant information (e.g., workspace name, ID).
```

### 4.2. Displaying MCP Command Results in Slack (via MCPServer)

When an MCP command is executed via Slack, the result will be sent back to Slack by MCPServer. MCPHub itself doesn't directly display these results unless it fetches them from MCPServer (e.g., a history log).

**Conceptual Flow:**

1.  User issues command in Slack (e.g., `/mcp list repos`).
2.  Slack sends event to MCPServer (via Socket Mode).
3.  MCPServer processes command, executes MCP logic.
4.  MCPServer uses Slack Web API (`chat.postMessage` or `chat.update`) to send the result back to the originating Slack channel.

**Example of a Slack message from MCPServer (using Block Kit for rich display):**

```json
{
  "channel": "C12345",
  "text": "Here are your latest GitHub repositories:",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Latest GitHub Repositories:*
- `repo-name-1` (Description of repo 1)
- `repo-name-2` (Description of repo 2)"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View All Repos"
          },
          "value": "view_all_repos",
          "action_id": "view_all_repos_action"
        }
      ]
    }
  ]
}
```

## 5. Conclusion

The frontend integration for Slack will focus on providing a clear and intuitive interface within MCPHub for users to connect their Slack workspaces and manage notification preferences. The actual real-time interaction and command processing will primarily occur on the MCPServer backend, with MCPHub acting as the configuration and status dashboard. This approach ensures a clean separation of concerns and leverages the strengths of both applications.

