# MCP MVP Architecture

## Overview

This app is a multi-provider LLM/AI hub with:
- Google OAuth authentication
- Dark mode
- Provider integrations (OpenAI, Google Drive, Gmail, GitHub, etc.)
- ChatBar for sending MCP commands
- Per-provider portal modals for account management and command discovery

---

## Main Components

- **AuthProvider / useAuth**: Handles user authentication and session.
- **GoogleOAuthProvider**: Provides Google OAuth context for Drive/Gmail.
- **MinimalAppContent**: Main app logic (auth, dark mode, chat, integrations).
- **ChatBar**: Main chat interface for MCP commands.
- **IntegrationsGallery**: Shows available providers.
- **ProviderPortalModal**: Per-provider portal for account connection and commands.
- **Integrations**: Provider-specific integrations UI.
- **Context Providers**: For chat input and marketplace search.

---

## Current State

- All advanced features are present in the codebase.
- For stability, only a minimal shell is rendered in `App.tsx`.
- All feature imports and logic are commented out with `TODO` notes for easy restoration.

---

## How to Restore Features

1. Uncomment the relevant imports in `App.tsx`.
2. Restore the `GoogleOAuthProvider`, `AuthProvider`, and other context providers.
3. Restore the main app content (`MinimalAppContent` or equivalent).
4. Add back components one at a time (ChatBar, IntegrationsGallery, etc.), testing after each.
5. If a component causes a white screen, debug and fix before proceeding.

---

## Notes

- All code for Google Drive, Gmail, and GitHub OAuth and integration is preserved.
- The OpenAI API key input and all per-provider logic is preserved.
- The app is ready for incremental restoration and testing of each feature. 