# MCP API Contract & Questionnaire

This document tracks the canonical payload shapes, health endpoints and open questions for the MCP gateway + provider micro-services.

---

## 1  Command Syntax & Routing

| Provider | Example Commands | Notes |
|----------|------------------|-------|
| github   | `list-repos`  `create-repo <name>`  `issues <owner/repo>` | back-end team: please confirm exact grammar + argument rules |
| google_drive | `list-files`  `upload-file <name>` |  |
| gmail | `list-messages`  `send-email <to> <subj>` |  |
| zapier | `list-zaps`  `trigger-zap <id>` |  |

### Open Questions for BE
1. Should multi-word commands be `kebab-case` (`create-repo`) or space-separated (`create repo`)?  
2. Are arguments always appended in the same **command** string or can/should they live in a JSON **args** object?  
3. Which (if any) commands are asynchronous and return a `jobId`?  


## 2  Auth & Security
* Do provider tokens need to be sent **every** call or can the gateway store them server-side?  
* Preferred header for tokens (`Authorization: Bearer …`) versus JSON field (`apiKey`).  
* If tokens are stored server-side, how does the client request an override? (`overrideToken: true` flag?)

## 3  Error Contract
```
{
  success: false,
  error:  "STRING",
  code?:  "ENUM_CODE",
  hint?:  "Human friendly recovery tip"
}
```
Please confirm   a) always non-2xx for errors?   b) list of `code` values.

## 4  Health & Discovery
* `/health` → `{ ok:true }`  (used by `ServerStatusIndicator`).  
* `/commands` → array of `{ provider, command, description }`  ←  client will cache; what TTL do you recommend?  
* Optional: `/info` → `{ version, build, providers:[{ id, ready }] }`

## 5  Road-map & Versioning
1. Upcoming breaking changes?  
2. Version header to request a specific contract (`Accept-Version: 2024-07-01`).

---

> **Next step:** back-end team please fill the ⚠️ sections (or provide a machine-readable spec). Front-end will then wire strict type definitions and auto-generated command palettes. 