# MCP Messenger Feature Development Instructions - June 22, 2025

## Introduction

This document provides a comprehensive analysis of the `mcpmessenger/server` and `mcpmessenger/messenger` repositories, outlining the current architecture and proposing specific next steps for implementing three key features: **Command Changing**, a **Prompt Builder**, and an **Intelligent Parser**. The instructions are tailored for both the frontend website and backend server teams.








# Architecture Analysis: MCP Messenger Server

The `mcpmessenger/server` repository serves as the backend for the MCP Messenger ecosystem. It is built on Node.js with Express.js and acts as a unified AI layer and integration hub. Its primary function is to orchestrate commands and workflows across various AI providers (OpenAI, Anthropic, Gemini) and third-party services (GitHub, Gmail, Slack, Jira, Notion, etc.).

## Key Architectural Components:

### 1. Node.js (Express.js) Backend:
- The core of the server, handling API requests and routing them to appropriate providers. It uses ES modules.

### 2. AI Providers Integration:
- Supports multiple AI models (OpenAI, Anthropic, Google Generative AI/Gemini) through a unified `/api/chat` contract. This allows the frontend to interact with different AI models without needing to know their specific APIs.

### 3. Plug-in Providers (`backend/providers/`):
- A modular system where new integrations can be added as JavaScript modules. Each module exposes an `id`, `supportedCommands`, and `executeCommand` function, allowing the server to dynamically load and use new providers. Examples include GitHub, Gmail, Slack, Jira, and Notion.

### 4. Secure Credential Vault:
- Uses SQLite for per-user integration tokens and AES-256-GCM encryption for secure storage of credentials. This ensures that sensitive API keys and tokens are not exposed directly to the frontend.

### 5. API Endpoints:
- Key endpoints include `/api/chat` (for AI interactions), `/api/workflow` (for chained commands), `/api/github`, `/api/google`, and `/api/health`.

### 6. Smart Intent Parsing and Chained Commands:
- The server is designed to parse natural language commands, route them to the correct provider, and execute multi-step instructions (chained commands). This is a crucial component for the intelligent parser and prompt builder features.

## Command Changing and the Server Architecture:

The server's existing `GET /api/commands` and `GET /api/providers` endpoints are fundamental to enabling 'command changing'. These endpoints allow the frontend to dynamically discover available commands and the providers that support them. This is a strong foundation for a flexible command system.

For 'command changing' to be fully realized, the server's role would involve:

1.  **Dynamic Command Registration:** While the current system uses `backend/providers/*.js` for new providers, a more robust command changing mechanism might involve a way to register, modify, or even unregister commands at runtime, perhaps through an administrative interface or configuration API. This would allow for greater flexibility in defining and updating commands without code changes.

2.  **Command Parameter Definition:** The current `GET /api/commands` only returns `id` and `description`. For a prompt builder, the server would ideally expose detailed schema for each command's parameters (e.g., expected input types, required/optional fields, default values, and descriptions for each parameter). This would allow the frontend to construct intelligent input forms for each command.

3.  **Workflow Definition and Storage:** The server already supports chained commands via `/api/workflow`. To facilitate a prompt builder that can create complex workflows, the server would need to manage and store these workflow definitions. The current roadmap mentions a "Visual workflow builder (drag-and-drop, optional)" which aligns with this need. The server would be responsible for persisting these user-defined workflows.

4.  **Intelligent Parsing Enhancement:** The server's "Smart intent parsing" and "Chained command parsing" are key. For an 'intelligent parser', the server would need to enhance its natural language processing capabilities to better understand user intent, even with ambiguous or incomplete commands. This might involve more sophisticated NLP models or rule-based systems that can infer missing parameters or suggest alternative commands based on context. The server could also provide feedback to the frontend on parsing ambiguities.

5.  **Contextual Memory:** The roadmap mentions "Contextual memory and chaining across sessions." This is vital for an intelligent parser and prompt builder, allowing the system to remember previous interactions and use that context to interpret new commands or suggest relevant options.

In summary, the `mcpmessenger/server` provides a solid foundation with its modular provider system and existing API endpoints for commands and workflows. The next steps for command changing, prompt building, and intelligent parsing would involve extending these capabilities to include dynamic command parameter definitions, robust workflow management, and advanced NLP for intent recognition and contextual understanding.

# Architecture Analysis: MCP Messenger Frontend

The `mcpmessenger/messenger` repository is the frontend application for the MCP Messenger ecosystem. It provides the user interface for interacting with the backend server, AI providers, and various integrations. It is built using React, TypeScript, and Tailwind CSS.

## Key Architectural Components:

### 1. React Frontend:
- The core of the user interface, providing a single chat interface for various AI and cloud services.

### 2. Vite:
- A fast build tool that provides hot module reloading for rapid local development.

### 3. Tailwind CSS:
- A utility-first CSS framework used for styling the application, enabling rapid UI development and a consistent design.

### 4. Supabase Integration:
- Used for authentication (Google OAuth) and secure storage of API keys and user integration tokens. The frontend interacts with Supabase directly for some functionalities, and also relies on the backend for others.

### 5. ChatBar and Command Handling:
- The central interaction point for users to input commands, both slash commands and natural language queries. It includes features like command suggestions and history.

### 6. Provider Portals:
- UI components for managing multiple accounts and API keys for each integrated provider (OpenAI, Anthropic, Gemini, GitHub, Google Drive, Gmail, etc.).

### 7. Backend Communication:
- The frontend communicates with the `mcpmessenger/server` via API calls, primarily through the `/api/command` endpoint. It uses the `VITE_BACKEND_URL` environment variable to point to the backend server.

## Interaction between MCP Messenger Frontend and Server:

The frontend and backend work in tandem to provide the full functionality of MCP Messenger:

1.  **Command Execution:** When a user enters a command in the ChatBar, the frontend sends this command to the backend server (e.g., to `/api/command`). The backend then processes the command, routes it to the appropriate provider, and executes it.

2.  **Dynamic Command Discovery:** The frontend can query the backend (e.g., `GET /api/commands` and `GET /api/providers`) to dynamically retrieve the list of supported commands and providers. This allows the frontend to build dynamic command palettes and validate available operations without hardcoding them.

3.  **Credential Management:** While the frontend has UI for entering API keys, the secure storage and management of these credentials are handled by Supabase and the backend server. The frontend uses `useToken` hook to manage provider credentials, reading from Supabase first and falling back to local cache.

4.  **Workflow Execution:** The frontend can initiate multi-step workflows by sending a workflow definition to the backend's `/api/workflow` endpoint. The backend then orchestrates the execution of these chained commands.

5.  **Real-time Updates:** The roadmap mentions considering Supabase Realtime for `user_credentials` to push token changes to all open tabs, indicating a potential for real-time synchronization between frontend instances and the backend.

## Command Changing, Prompt Builder, and Intelligent Parser in the Frontend:

### Command Changing:
- The frontend's existing command suggestions UX and the ability to dynamically fetch commands from the backend (`GET /api/commands`) provide a strong foundation for command changing. To further enhance this:

1.  **Dynamic UI for Command Parameters:** When a user selects a command (or the intelligent parser suggests one), the frontend needs to dynamically render input fields based on the command's expected parameters. This requires the backend to expose a more detailed schema for each command, as discussed in the server analysis.

2.  **Visual Command Editor:** For advanced command changing, a visual editor (similar to the proposed "Workflow builder") would allow users to drag-and-drop command components, configure their parameters, and see the resulting command string or workflow. This would be a significant UI/UX enhancement.

### Prompt Builder:

The prompt builder would be a specialized UI component that helps users construct complex prompts, especially for AI models or chained workflows. This would involve:

1.  **Contextual Prompt Suggestions:** Based on the selected command and previous interactions, the prompt builder could suggest relevant prompt elements or templates.

2.  **Parameterized Prompt Templates:** For commands with multiple parameters, the prompt builder could provide a structured way to fill in these parameters, ensuring correct syntax and reducing errors. This ties into the need for the backend to expose command parameter schemas.

3.  **Workflow Visualization:** For chained commands, the prompt builder could visually represent the flow of information between commands, allowing users to understand and modify the sequence. This aligns with the "Visual workflow builder" mentioned in the server's roadmap.

4.  **Real-time Validation:** As the user builds the prompt, the frontend could provide real-time validation against the command's schema, highlighting errors or suggesting corrections.

### Intelligent Parser:

The intelligent parser on the frontend would work in conjunction with the backend's smart intent parsing. Its role would be to provide immediate feedback and suggestions to the user as they type. This could include:

1.  **Autocomplete and Suggestions:** Beyond simple command suggestions, the intelligent parser could offer context-aware autocomplete for command arguments, provider names, or even values (e.g., listing available GitHub repositories when the user types `/github list-repos`).

2.  **Error Highlighting and Correction:** If the user types an invalid command or an incorrect parameter, the frontend could highlight the error and suggest corrections in real-time.

3.  **Intent Clarification:** If the user's input is ambiguous, the intelligent parser could ask clarifying questions or present a list of possible interpretations, allowing the user to choose the correct one.

4.  **Visual Representation of Parsed Commands:** As the user types natural language, the intelligent parser could visually break down the input into its constituent commands and parameters, showing how the system interprets the request before execution. This aligns with the "Inline Chaining in Chat" feature.

In summary, the frontend will be responsible for providing a rich, interactive user experience for command changing, prompt building, and intelligent parsing, leveraging the backend's capabilities for command discovery, workflow execution, and advanced natural language processing. The existing React and TypeScript foundation, along with the ChatBar and provider portals, provide a strong starting point for these enhancements.







# Feature Requirements Analysis

This section details the specific requirements for implementing 'command changing', a 'prompt builder', and an 'intelligent parser' within the MCP Messenger ecosystem, considering both frontend and backend perspectives.

## 1. Command Changing

**Goal:** To enable dynamic modification, creation, and management of commands, allowing for greater flexibility and extensibility of the MCP Messenger system.

### Backend Requirements:

*   **Enhanced Command API:** The existing `GET /api/commands` endpoint needs to be extended to provide more detailed metadata for each command. This includes:
    *   **Parameters Schema:** For each command, a clear schema defining its expected parameters (e.g., name, type, description, required/optional status, default values, and potential enumerations or validation rules). This will allow the frontend to dynamically generate input forms.
    *   **Command Categories/Tags:** A mechanism to categorize or tag commands (e.g., 'AI', 'GitHub', 'Utility') for better organization and discoverability.
    *   **Visibility Flags:** A flag to indicate if a command should be visible in the UI or is for internal use only.
*   **Command Management API (CRUD):** New API endpoints (e.g., `POST /api/commands`, `PUT /api/commands/{id}`, `DELETE /api/commands/{id}`) to allow authorized users to create, update, and delete custom commands. This would likely be an administrative function.
*   **Dynamic Command Loading:** The backend's modular provider system (`backend/providers/*.js`) already supports adding new providers. This needs to be extended to allow for dynamic loading and unloading of commands associated with these providers without requiring a server restart, especially if commands can be managed via API.
*   **Version Control for Commands:** Consider a mechanism for versioning commands, especially if they can be modified by users, to allow for rollbacks or tracking changes.

### Frontend Requirements:

*   **Dynamic Command UI Generation:** The frontend must be able to consume the enhanced command metadata from the backend to dynamically render appropriate input fields and forms for each command. This includes handling different input types (text, numbers, dropdowns, booleans), validation, and displaying descriptions.
*   **Command Management Interface:** For administrative users, a dedicated UI for creating, editing, and deleting commands. This interface would leverage the new backend CRUD APIs.
*   **Improved Command Discovery:** Enhance the ChatBar's autocomplete and suggestion features to leverage the richer command metadata, including categories and detailed descriptions.
*   **Visual Command Editor (Optional but Recommended):** A drag-and-drop interface where users can visually construct commands by selecting actions and configuring their parameters. This would be particularly useful for complex commands or for users who prefer a visual approach.

## 2. Prompt Builder

**Goal:** To provide users with a structured and intuitive way to construct complex prompts, especially for AI models and chained workflows, ensuring correct syntax and maximizing effectiveness.

### Backend Requirements:

*   **Prompt Template Storage:** If the prompt builder allows users to save and reuse prompt templates, the backend would need to store these templates, potentially associated with specific commands or providers.
*   **Workflow Definition Storage:** The backend already supports chained workflows. The prompt builder will rely heavily on the backend's ability to store and execute these workflow definitions via the `/api/workflow` endpoint.
*   **Parameter Validation for Workflows:** When a workflow is submitted, the backend should validate that all required parameters for each step are present and correctly formatted, leveraging the command parameter schemas.

### Frontend Requirements:

*   **Dedicated Prompt Builder UI:** A distinct interface or modal for building prompts, separate from the main ChatBar, offering more space and tools for complex constructions.
*   **Contextual Input Fields:** Based on the selected command or AI model, the prompt builder should present relevant input fields for parameters, potentially with pre-filled values or suggestions.
*   **Dynamic Parameter Input:** As the user selects a command, the prompt builder should dynamically display the parameters required for that command, using the schema provided by the backend.
*   **Workflow Visualization:** For chained commands, the prompt builder should visually represent the sequence of actions and how data flows between them. This could be a flowchart-like interface.
*   **Real-time Feedback and Validation:** Provide immediate visual feedback on prompt validity, highlighting missing parameters, incorrect data types, or potential issues.
*   **Prompt History and Templates:** Allow users to save, load, and manage their custom prompt templates for quick reuse.
*   **Integration with ChatBar:** The prompt builder should seamlessly integrate with the ChatBar, allowing users to initiate a prompt-building session from the ChatBar and then insert the constructed prompt back into the ChatBar for execution.

## 3. Intelligent Parser

**Goal:** To enhance the system's ability to understand natural language commands, provide real-time assistance, and gracefully handle ambiguities or incomplete inputs.

### Backend Requirements:

*   **Advanced Natural Language Processing (NLP):** While the backend already has "Smart intent parsing" and "Chained command parsing," further enhancements might involve:
    *   **Named Entity Recognition (NER):** To identify and extract key entities (e.g., dates, names, file paths) from natural language input that can be mapped to command parameters.
    *   **Intent Classification Refinement:** Improve the accuracy of identifying the user's intended command even with variations in phrasing.
    *   **Contextual Understanding:** Leverage session history and user preferences to better interpret ambiguous commands.
*   **Parameter Inference and Suggestion:** The backend should be able to infer missing parameters from context or suggest likely values based on historical usage or available data (e.g., suggesting GitHub repository names).
*   **Ambiguity Resolution:** If a natural language command can be interpreted in multiple ways, the backend should be able to return a list of possible interpretations to the frontend for user clarification.
*   **Error Reporting:** Provide detailed error messages and suggestions for correction when a command cannot be parsed or executed.

### Frontend Requirements:

*   **Real-time Autocomplete and Suggestions:** As the user types in the ChatBar, the intelligent parser should provide context-aware autocomplete for commands, parameters, and values. This goes beyond simple string matching to understanding the user's intent.
*   **Inline Error Highlighting and Correction:** Immediately highlight syntax errors or missing parameters in the ChatBar as the user types, with tooltips or suggestions for correction.
*   **Clarification Prompts:** If the backend identifies ambiguity, the frontend should present clear options to the user for clarification (e.g., "Did you mean 'list-repos' or 'repo-summary'?").
*   **Visual Breakdown of Parsed Commands:** As the user types natural language, the intelligent parser could visually break down the input into its constituent commands and parameters, showing how the system interprets the request before execution. This aligns with the "Inline Chaining in Chat" feature.
*   **Contextual Help:** Provide dynamic help messages or examples based on the current command being typed or the context of the conversation.

These requirements outline the necessary steps to evolve the MCP Messenger into a more powerful and user-friendly platform for command changing, prompt building, and intelligent parsing.







# Implementation Strategy Development

This section outlines a phased implementation strategy for integrating the new features: command changing, prompt builder, and intelligent parser. The strategy is divided into clear steps for both the backend (MCP Messenger Server) and frontend (MCP Messenger) teams.

## Backend Team: MCP Messenger Server

### Phase 1: Enhance Command API and Dynamic Loading

1.  **Define Command Parameter Schema:**
    *   **Action:** Modify the `backend/providers/*.js` structure or introduce a new mechanism to include a detailed JSON schema for each command's parameters. This schema should define input types (string, number, boolean, enum), required/optional status, default values, and descriptive labels.
    *   **Example:** For a `create-issue` command, the schema would define parameters like `projectKey` (string, required), `summary` (string, required), `description` (string, optional), `issueType` (enum: Bug, Task, Story).
    *   **Impact:** This is foundational for the frontend's dynamic UI generation for commands and the prompt builder.

2.  **Extend `GET /api/commands`:**
    *   **Action:** Update the `/api/commands` endpoint to return the newly defined parameter schemas along with existing command metadata (id, description, providers).
    *   **Impact:** Enables the frontend to dynamically render command input forms.

3.  **Implement Command Management API (CRUD - Admin Only):**
    *   **Action:** Develop new REST endpoints (e.g., `POST /api/admin/commands`, `PUT /api/admin/commands/{id}`, `DELETE /api/admin/commands/{id}`) for authorized administrative users to create, update, and delete custom commands and their associated schemas.
    *   **Impact:** Provides a programmatic way to manage commands, crucial for advanced command changing capabilities.

4.  **Refine Dynamic Provider/Command Loading:**
    *   **Action:** Investigate and implement mechanisms for dynamically loading and unloading provider modules and their commands without requiring a server restart. This might involve a watch mechanism on the `backend/providers/` directory or a more sophisticated plugin architecture.
    *   **Impact:** Allows for real-time updates to available commands without service interruption.

### Phase 2: Enhance Intelligent Parsing and Workflow Management

1.  **Improve Natural Language Processing (NLP) Capabilities:**
    *   **Action:** Enhance the existing "Smart intent parsing" logic. This could involve integrating a more advanced NLP library for Named Entity Recognition (NER) to extract parameters from natural language input (e.g., identifying a project key or issue summary from a sentence).
    *   **Impact:** Improves the accuracy and flexibility of the intelligent parser.

2.  **Parameter Inference and Ambiguity Resolution:**
    *   **Action:** Develop logic to infer missing command parameters based on context (e.g., previous commands, user preferences) or suggest likely values. Implement a mechanism to return multiple possible interpretations to the frontend if a command is ambiguous.
    *   **Impact:** Reduces user effort and improves the intelligent parser's robustness.

3.  **Workflow Definition Persistence and Validation:**
    *   **Action:** Ensure the `/api/workflow` endpoint can robustly store and retrieve complex workflow definitions, including all step parameters. Implement server-side validation of workflow steps against the command parameter schemas.
    *   **Impact:** Supports the prompt builder's ability to create and manage multi-step workflows reliably.

4.  **Contextual Memory Implementation:**
    *   **Action:** Begin implementing a system for contextual memory across sessions, as outlined in the roadmap. This could involve storing conversation history or user-specific preferences that influence command interpretation.
    *   **Impact:** Enables more intelligent and personalized parsing and prompt suggestions.

## Frontend Team: MCP Messenger

### Phase 1: Dynamic Command UI and Basic Prompt Builder

1.  **Consume Enhanced Command API:**
    *   **Action:** Update the frontend to fetch and parse the detailed command schemas from the `GET /api/commands` endpoint.
    *   **Impact:** Foundation for dynamic UI generation.

2.  **Dynamic Command Input Forms:**
    *   **Action:** Develop a component that dynamically renders input fields (text, number, dropdowns, checkboxes) based on the command parameter schemas received from the backend. This component should handle input validation and display parameter descriptions.
    *   **Impact:** Enables users to easily configure command parameters without needing to know the exact syntax.

3.  **Basic Prompt Builder Modal/Panel:**
    *   **Action:** Create a dedicated UI (modal or panel) for the prompt builder. Initially, this builder will allow users to select a command and then use the dynamic input forms to configure its parameters. A preview of the generated command string should be displayed.
    *   **Impact:** Provides a structured way for users to build commands.

4.  **Integrate Prompt Builder with ChatBar:**
    *   **Action:** Add a button or command in the ChatBar that opens the prompt builder. Once a command is built, it should be inserted back into the ChatBar for execution.
    *   **Impact:** Seamless user experience for building and executing commands.

### Phase 2: Advanced Prompt Builder and Intelligent Parser UI

1.  **Visual Workflow Builder (for Prompt Builder):**
    *   **Action:** Implement a drag-and-drop interface within the prompt builder that allows users to visually construct chained commands. This would involve representing each command as a block, allowing users to connect them and configure parameters for each step.
    *   **Impact:** Empowers users to create complex workflows intuitively.

2.  **Real-time Autocomplete and Suggestions (Intelligent Parser):**
    *   **Action:** Enhance the ChatBar to provide context-aware autocomplete and suggestions as the user types. This should leverage the backend's enhanced NLP capabilities and command parameter schemas to suggest relevant commands, parameters, and even values (e.g., listing available GitHub repositories).
    *   **Impact:** Significantly improves user efficiency and reduces errors.

3.  **Inline Error Highlighting and Clarification Prompts (Intelligent Parser):**
    *   **Action:** Implement real-time syntax checking and error highlighting in the ChatBar. If the backend returns ambiguous interpretations, the frontend should present clear clarification prompts to the user.
    *   **Impact:** Guides users to correct commands and resolves ambiguities effectively.

4.  **Visual Breakdown of Parsed Commands (Intelligent Parser):**
    *   **Action:** As the user types natural language, display a visual representation of how the input is being parsed into a structured command or workflow before execution. This could be a temporary overlay or a dedicated section.
    *   **Impact:** Provides transparency and allows users to confirm the system's interpretation.

## General Considerations for Both Teams:

*   **API Versioning:** As APIs are extended and modified, consider implementing API versioning to ensure backward compatibility and smooth transitions.
*   **Testing:** Implement comprehensive unit, integration, and end-to-end tests for all new features to ensure stability and correctness.
*   **Documentation:** Maintain clear and up-to-date documentation for all API changes, new components, and features.
*   **User Feedback:** Continuously gather user feedback throughout the development process to iterate and refine the features.

This phased approach allows for incremental development and delivery of value, building upon the existing architecture of MCP Messenger.


