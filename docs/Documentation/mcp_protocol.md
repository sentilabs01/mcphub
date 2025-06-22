# Protocol for Connecting MCP Hub to Zapier MCP Client

## Introduction
This document outlines the protocol for establishing a connection between an MCP Hub and the Zapier MCP Client. It also addresses common questions regarding the Zapier GUI and the nature of the "MCP key" within this ecosystem. The Model Context Protocol (MCP) is an open standard designed to facilitate seamless integration between Large Language Model (LLM) applications and external data sources and tools [4]. Zapier leverages this protocol to enable AI assistants to interact with a vast array of applications and actions.

## Model Context Protocol (MCP) Overview

MCP provides a standardized method for applications to:
*   Share contextual information with language models.
*   Expose tools and capabilities to AI systems.
*   Build composable integrations and workflows.

The protocol operates using JSON-RPC 2.0 messages, establishing communication between three primary components [4]:

*   **Hosts**: These are the LLM applications that initiate connections.
*   **Clients**: These act as connectors within the host application.
*   **Servers**: These services provide the necessary context and capabilities to the LLMs.

Zapier MCP acts as a server endpoint, allowing AI clients (such as Claude or Cursor) to connect to a user's Zapier account and access its extensive integration network [1].

## Connecting MCP Hub to Zapier MCP Client

The connection process between an MCP Hub (as exemplified by the `sentilabs01/mcphub` project [3]) and the Zapier MCP Client involves several key steps, primarily centered around the unique MCP Server URL provided by Zapier.

### 1. Generating Your MCP Endpoint

Zapier provides a unique, dynamic MCP server URL that serves as the primary connection point for your AI assistant. This endpoint is crucial as it securely links your AI to Zapier's integration network [2].

**Action:** Navigate to the Zapier MCP settings (as shown in the provided screenshot) to obtain your unique MCP Server URL. This URL will contain a security token that acts as an authentication credential.

### 2. Configuring Your Actions

Before connecting your MCP Hub, you need to define and scope the specific actions your AI is permitted to perform within Zapier. This ensures precise control over the capabilities exposed to your AI assistant [2].

**Action:** Within the Zapier MCP interface, configure the desired actions that your AI will be able to trigger. This might involve selecting specific app integrations and their associated actions (e.g., sending a Slack message, managing Google Calendar events).

### 3. Integrating with Your AI Assistant (MCP Hub)

Once the MCP endpoint is generated and actions are configured, the MCP Hub needs to be integrated with this endpoint. The `sentilabs01/mcphub` project, being a frontend for an MCP Hub, would typically consume this URL to establish the connection.

**Protocol Steps for MCP Hub Integration:**

1.  **Obtain the MCP Server URL:** The MCP Hub application must be configured with the unique MCP Server URL obtained from Zapier. This URL contains the necessary security token for authentication.

    *   **Example URL Structure (from screenshot):** `https://actions.zapier.com/mcp/sk-ak-bgqzAoBPc2hdfow@fthjFSRSl/sse`

    *   **Caution:** As indicated by Zapier, treat this MCP Server URL like a password. It grants access to your AI Actions and data [screenshot]. It should be stored securely and not exposed publicly.

2.  **Establish Communication:** The MCP Hub, acting as an MCP Client, will use this URL to initiate JSON-RPC 2.0 communication with the Zapier MCP Server. The specific methods and parameters for these JSON-RPC calls would be defined by the MCP specification and Zapier's implementation of it.

3.  **Handle Authentication:** The security token embedded in the URL serves as the primary authentication mechanism. The MCP Hub must correctly present this token with its requests to the Zapier MCP Server.

4.  **Process Responses:** The Zapier MCP Server will respond to the MCP Hub's requests, providing contextual information, tool definitions, and execution results based on the configured actions.

5.  **Error Handling:** Implement robust error handling within the MCP Hub to manage potential issues such as invalid URLs, expired tokens, or server-side errors. The MCP specification includes provisions for error reporting [4].

### Technical Considerations from `sentilabs01/mcphub` Repository [3]:

The `mcphub` repository provides insights into how a frontend MCP client might interact with MCP servers. Key aspects relevant to the connection protocol include:

*   **Backend Routing:** The repository indicates that all LLM providers (OpenAI, Anthropic, Gemini) route through a backend for chat and key validation. This suggests that the MCP Hub might not directly connect to LLM providers but rather uses its own backend to proxy requests, enhancing security by preventing API keys from being directly exposed on the frontend.
*   **Supabase Integration:** The project uses Supabase for secure API key management and MCP server configuration (`mcp_servers` table). This implies that the MCP Hub would likely retrieve the Zapier MCP Server URL and associated credentials from a secure backend store rather than having them hardcoded.
*   **Token Persistence:** The repository highlights ongoing work on token persistence issues (e.g., for GitHub tokens). This is a critical consideration for maintaining a stable connection with Zapier MCP, as the MCP Server URL (which contains the security token) needs to be reliably saved and loaded.

## Addressing User Concerns

### Zapier GUI: Legacy vs. New

The user's observation and the developer's confusion regarding the Zapier GUI being a "legacy" one are directly addressed by the banner present in the provided screenshot. The message "Important: This version of Zapier MCP is being replaced. Get started with the new version!" clearly indicates that the interface being viewed is indeed the older version, and Zapier is actively migrating users to an updated experience. This confirms that the developer's assessment, while seemingly contradictory to a "new" GUI, is accurate in the context of an ongoing transition.

### The "MCP Key" and its Length

The term "MCP key" as used by the user refers to the unique alphanumeric string embedded within the Zapier MCP Server URL. This string (e.g., `sk-ak-bgqzAoBPc2hdfow@fthjFSRSl/sse` from the screenshot) functions as a security token or API key. It is generated by Zapier and is essential for authenticating requests from your MCP Hub to the Zapier MCP Client. Its purpose is to grant your AI Actions access to your data and capabilities within Zapier.

**Regarding its length:** The MCP specification itself does not define a fixed length for such a key, as it is a credential managed by the specific MCP server implementation (in this case, Zapier). The length would be determined by Zapier's internal security and token generation policies. It is not a standardized length across all MCP implementations. The `mcphub` repository's focus on secure storage of API keys (via Supabase and backend proxying) reinforces the idea that these are sensitive credentials whose exact format and length are implementation-specific rather than protocol-defined.

## Conclusion

Connecting an MCP Hub to the Zapier MCP Client involves configuring the Hub with the unique and securely managed MCP Server URL provided by Zapier. This URL contains a critical security token that authenticates the MCP Hub's requests. The Zapier GUI is undergoing a transition, with a newer version replacing the one currently in use. The "MCP key" is identified as the security token within the MCP Server URL, whose length is determined by Zapier's internal systems rather than the general MCP protocol specification.

## References

[1] Zapier. "Use Zapier MCP with your client." *Zapier Help Center*. Available at: [https://help.zapier.com/hc/en-us/articles/36265392843917-Use-Zapier-MCP-with-your-client](https://help.zapier.com/hc/en-us/articles/36265392843917-Use-Zapier-MCP-with-your-client)

[2] Zapier. "Zapier MCP—Connect your AI to any app instantly." *Zapier.com*. Available at: [https://zapier.com/mcp](https://zapier.com/mcp)

[3] sentilabs01. "mcphub: MPC Hub frontend." *GitHub*. Available at: [https://github.com/sentilabs01/mcphub](https://github.com/sentilabs01/mcphub)

[4] Model Context Protocol. "Specification - Model Context Protocol." *modelcontextprotocol.io*. Available at: [https://modelcontextprotocol.io/specification/2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)

[Screenshot] User-provided screenshot of Zapier MCP settings page, June 19, 2025.

