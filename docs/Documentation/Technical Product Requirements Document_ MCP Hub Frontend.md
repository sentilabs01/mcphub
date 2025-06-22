# Technical Product Requirements Document: MCP Hub Frontend

## 1. Introduction

This document outlines the technical product requirements for the MCP Hub Frontend, a React-based application serving as the user interface for the Model Context Protocol (MCP) platform. The frontend is designed to provide a seamless and intuitive experience for managing AI integrations, API keys, and interacting with various LLM providers and external services.

## 2. Goals and Objectives

The primary goals for the MCP Hub Frontend are:

*   To provide a secure and user-friendly interface for managing AI and automation integrations.
*   To enable efficient interaction with multiple LLM providers (OpenAI, Anthropic, Gemini) through a unified chat interface.
*   To facilitate secure API key management and multi-account support for various services.
*   To offer a robust and extensible platform for future integrations and features.
*   To ensure a highly performant, responsive, and accessible user experience.

## 3. Scope

This PRD covers the following key areas of the MCP Hub Frontend:

*   **User Authentication and Authorization:** Integration with Google OAuth via Supabase for secure user access.
*   **Provider Integration Management:** UI for adding, removing, and managing API keys/tokens for various providers (LLMs, GitHub, Google Drive, Gmail, Zapier).
*   **Multi-Account Management:** Functionality to support multiple accounts per provider, including active account selection.
*   **AI ChatBar:** A central interface for natural language and slash command interactions with LLMs.
*   **Command Routing:** Mechanisms for routing commands to appropriate MCP servers and external services.
*   **User Settings and Preferences:** Management of user-specific configurations and UI preferences.
*   **Security:** Ensuring secure handling of sensitive information, particularly API keys.
*   **UI/UX:** Focus on a modern, responsive, and intuitive user interface.

## 4. Current State and Progress

The MCP Hub Frontend is in an active development phase, with significant progress made in establishing core functionalities. Key achievements include:

*   **Backend-Routed LLM Interactions:** All LLM provider interactions are now securely routed through the backend, enhancing security and control.
*   **Streamlined UI:** The "Run a Command" section has been removed for a cleaner and less confusing user interface.
*   **Accurate API Key Testing:** The "Test Key" button in provider portals now accurately validates API keys for all integrated providers.
*   **Basic Multi-Account Management:** The UI supports adding, removing, and setting active accounts, although further robustness is required.
*   **Functional Google OAuth:** User authentication via Google OAuth through Supabase is successfully implemented.
*   **Initial Command Routing:** `/drive` and `/gmail` commands are routing to MCP servers using Supabase session tokens.
*   **Comprehensive Documentation:** The README provides a detailed overview of current features, known issues, and future plans.

## 5. Critical Next Steps and Future Enhancements

Based on the current progress and identified areas for improvement, the following critical next steps are prioritized for the MCP Hub Frontend:

### 5.1. Token Persistence and Management

**Objective:** Ensure reliable and persistent storage and retrieval of API tokens for all provider portals.

**Details:**
*   **Reliable `localStorage` Persistence:** Implement robust mechanisms to ensure that API tokens, especially for providers like GitHub, are reliably saved to and loaded from `localStorage` across sessions.
*   **Robust Active Account Logic:** Refine the multi-account management logic to ensure that the "active" account selection is consistently applied and that the correct API key is used for all subsequent API calls.
*   **Secure Token Refresh:** Implement a robust token refresh mechanism for Google integrations to prevent session token expiry issues after page reloads. This may involve coordination with the backend for secure token exchange.

### 5.2. MCP Server Discovery and Error Handling

**Objective:** Improve the robustness and user feedback for MCP server discovery and error handling.

**Details:**
*   **Clearer Error Messages:** Provide more informative and user-friendly error messages when MCP server lookup fails or when `mcp_servers` table entries are missing or duplicated in Supabase.
*   **Auto-Healing Mechanisms:** Explore and implement mechanisms to automatically detect and potentially correct common configuration issues related to MCP server entries.
*   **Real-time Status Indicators:** Enhance the UI to provide real-time status indicators for MCP server connections, allowing users to quickly identify and troubleshoot connectivity issues.

### 5.3. Account Management UI Polish

**Objective:** Enhance the user interface for multi-account management to provide a more polished and intuitive experience.

**Details:**
*   **Streamlined Account Selection:** Improve the user flow for selecting and switching between active accounts for each provider.
*   **Clear Status Displays:** Provide clear visual cues and status messages for account connection status, API key validity, and active account selection.
*   **Error and Success Notifications:** Implement consistent and prominent notifications for successful account additions, removals, and any errors encountered during account management.

### 5.4. Comprehensive Testing and CI/CD

**Objective:** Establish a robust testing framework and integrate a continuous integration/continuous deployment (CI/CD) pipeline.

**Details:**
*   **Unit and Integration Tests:** Implement comprehensive unit and integration tests for critical components, services, and functionalities using a suitable testing framework (e.g., Jest, React Testing Library).
*   **End-to-End Testing:** Introduce end-to-end tests to validate critical user flows and ensure the overall stability of the application.
*   **Automated CI/CD:** Configure a CI/CD pipeline (e.g., GitHub Actions) to automate testing, code quality checks, building, and deployment processes, ensuring faster and more reliable releases.

### 5.5. Expanded Integrations and Command Polish

**Objective:** Continue expanding the range of supported integrations and refine the command dropdowns for an intuitive user experience.

**Details:**
*   **New Provider Integrations:** Prioritize adding new provider integrations based on user demand and strategic value.
*   **Command Dropdown Refinement:** Improve the usability and completeness of command dropdowns for each provider, including autofill and "Run" support for the ChatBar.
*   **User-Defined Commands:** Explore the possibility of allowing users to define custom commands or macros for personalized workflows.

### 5.6. Component Documentation

**Objective:** Improve internal development efficiency and consistency through comprehensive component documentation.

**Details:**
*   **Storybook Integration:** Consider integrating Storybook or a similar tool to document and test UI components in isolation, providing a living style guide and facilitating collaborative development.

## 6. Technical Specifications

*   **Frontend Framework:** React (TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS, PostCSS
*   **State Management:** React Context API, custom hooks
*   **Authentication:** Google OAuth via Supabase
*   **API Communication:** RESTful APIs, `mcpApiService.ts`, `mcpServerService.ts`
*   **Dependencies:** As listed in `package.json` (e.g., `@supabase/supabase-js`, `lucide-react`, Radix UI components)

## 7. Open Questions and Dependencies

*   **Backend API Stability:** Continued stability and evolution of the `mcpserver` API is crucial for frontend development.
*   **Supabase Configuration:** Accurate and up-to-date `mcp_servers` table entries in Supabase are essential for MCP server discovery.
*   **Design System Evolution:** Any significant changes to the overall design system or branding will require corresponding updates in the frontend.

## 8. Metrics for Success

*   **User Engagement:** Increased active users and frequency of interaction with AI ChatBar and integrations.
*   **API Key Validation Success Rate:** High success rate for API key validation across all providers.
*   **Reduced Support Tickets:** Decrease in support tickets related to token persistence, MCP server connectivity, and account management issues.
*   **Code Quality Metrics:** Improved code coverage, reduced linting errors, and adherence to coding standards.
*   **Deployment Frequency:** Increased frequency of stable and reliable deployments.



