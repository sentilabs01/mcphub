# Make MCP Server Overview

## What is Make MCP Server?
Make MCP Server enables seamless integration of Make scenarios into AI systems (AI Assistants and Agents), empowering them to perform real-world tasks through pre-configured workflows.

## Key Benefits:
*   Turn Make scenarios into callable tools for AI.
*   Maintain complex automation logic in Make while exposing functionality to AI.
*   Create bidirectional communication between AI and existing automation workflows.

## How it works:
Make MCP Server lists all scenarios scheduled to run "On Demand" as tools available to AI. Each scenario can be configured with:
*   **Inputs:** Parameters that AI will fill with data when the scenario runs.
*   **Outputs:** Data that will be returned from the scenario back to AI.

Detailed scenario descriptions are recommended to help AI understand the purpose of the tool and improve prompt reliability.

## Make MCP Server Types:
1.  **Make Cloud MCP Server (recommended):** Cloud-based, hosted by Make, runs via SSE (Server-Sent Events), suitable for any integrations and environments.
2.  **Make Local MCP Server (legacy):** Basic version run locally, ideal for scenarios requiring local management and control.

## Relationship to Slash / MCP:
Similar to Zapier, Make.com offers an MCP Server that can be integrated with the Slash / MCP project. The Slash / MCP server would act as an MCP client, sending requests to the Make MCP Server to trigger and manage Make scenarios. This would allow the Slash / MCP project to leverage Make.com's extensive automation capabilities and integrations.

## Nuances of Organization Owning Scenarios:
Make.com's MCP Server integrates with scenarios owned by the Make.com account. This means that the organization owning the Make.com account would be responsible for creating, managing, and maintaining the scenarios that the Slash / MCP server interacts with. This implies a clear separation of concerns: the Slash / MCP project handles the AI interaction and command routing, while Make.com handles the actual automation workflows. This can be beneficial for organizations that already use Make.com for their automation needs, as they can leverage their existing infrastructure and expertise.

