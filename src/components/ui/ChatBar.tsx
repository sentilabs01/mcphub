import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { callLLMProvider, LLMProvider, LLMMessage } from '../../utils/llm';
import { useAuth } from '../../hooks/useAuth';
import { getUserSettings, saveUserSettings } from '../../services/userSettingsService';
import { getUserChatHistory, addUserChatMessage } from '../../services/userChatHistoryService';
import { useMarketplaceSearch } from '../marketplace/MarketplaceSearchContext';
import { fetchUserRepos, createIssue } from '../../services/githubService';
import {
  listDriveFiles,
  getDriveFileDetails,
  downloadDriveFile,
  uploadDriveFile,
  deleteDriveFile,
  shareDriveFile,
  searchDriveFiles,
} from '../../services/googleService';
import { useChatBarInput } from '../../context/ChatBarInputContext';
import { PROVIDERS } from '../../data/providers';
import { MCPServerService } from '../../services/mcpServerService';
import { runMCPCommand, fetchMCPCommands } from '../../services/mcpApiService';
import { jwtDecode } from 'jwt-decode';
import { getUserIntegrationAccounts } from '../../services/userIntegrationAccountsService';
import { prettyPrintResult } from '../../utils/prettyPrint';
import { getCredential } from '../../services/credentialsService';

const PROVIDER_OPTIONS: { label: string; value: LLMProvider }[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Google Gemini', value: 'google' },
];

const LOCAL_KEY = 'mcp_llm_settings';
const LOCAL_HISTORY_KEY = 'mcp_llm_history';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSettings(settings: any) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history: any) {
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
}

// Add a simple intent parser for GitHub
function parseGithubIntent(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // list repos commands
  if (/^(list|get|show)\s+(my\s+)?repos?/.test(lower)) {
    return 'list repos';
  }

  // list issues for owner/repo
  const issuesMatch = lower.match(/(?:list|show)\s+(?:open\s+)?issues\s+for\s+([\w-]+\/[\w-]+)/);
  if (issuesMatch) {
    return `issues ${issuesMatch[1]}`;
  }

  // list pulls for owner/repo
  const pullsMatch = lower.match(/(?:list|show)\s+(?:open\s+)?(?:pull\s+requests|prs|pulls)\s+for\s+([\w-]+\/[\w-]+)/);
  if (pullsMatch) {
    return `pulls ${pullsMatch[1]}`;
  }

  // create repo <name>
  const createRepoMatch = lower.match(/create\s+(?:new\s+)?repo\s+(?:named\s+)?([\w-]+)/);
  if (createRepoMatch) {
    return `create repo ${createRepoMatch[1]}`;
  }

  // create issue pattern with optional body
  const createIssueMatch = lower.match(/create\s+issue\s+in\s+([\w-]+\/[\w-]+)\s+titled\s+"([^"]+)"(?:\s+with\s+body\s+"([^"]+)")?/);
  if (createIssueMatch) {
    const [, repo, title, body] = createIssueMatch;
    return body ? `create issue ${repo} "${title}" "${body}"` : `create issue ${repo} "${title}"`;
  }

  return null; // no intent recognised
}

// Simple intent parser for Google Drive
function parseDriveIntent(input: string): string | null {
  const lower = input.toLowerCase();
  if (lower.includes('list drive files') || lower.includes('list my drive files') || lower.includes('get drive files') || lower.includes('drive files')) return '/drive List files';
  const uploadMatch = lower.match(/upload (.+) to drive/);
  if (uploadMatch) {
    return `/drive Upload ${uploadMatch[1]}`;
  }
  const downloadMatch = lower.match(/download (.+) from drive/);
  if (downloadMatch) {
    return `/drive Download ${downloadMatch[1]}`;
  }
  return null; // no intent found
}

// Simple intent parser for Gmail
function parseGmailIntent(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // list inbox / unread / recent
  if (/^(list|show|get)\s+(my\s+)?((recent|latest)\s+)?(inbox|emails|messages)(?:\s+unread)?/.test(lower)) {
    return '/gmail List inbox';
  }

  // Phrases like "recent emails" or "latest inbox" (no leading verb)
  if (/^(recent|latest)\s+(emails?|messages?|inbox)/.test(lower)) {
    return '/gmail List inbox';
  }

  // search emails with keyword
  const searchMatch = lower.match(/search emails? for "([^"]+)"/);
  if (searchMatch) {
    return `/gmail Search emails "${searchMatch[1]}"`;
  }

  // send email to someone
  const sendMatch = lower.match(/send email to ([^\s]+) subject "([^"]+)" body "([^"]+)"/);
  if (sendMatch) {
    const [, to, subject, body] = sendMatch;
    return `/gmail Send email ${to} "${subject}" "${body}"`;
  }

  return null;
}

export const ChatBar: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const { user, session } = useAuth();
  const { setFilters } = useMarketplaceSearch();
  const { input, setInput } = useChatBarInput();
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<{ provider: string; command: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const googleToken = session?.provider_token || (session as any)?.access_token || '';
  // Command history state
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  // Cache of live commands fetched from MCP servers { providerId -> commands[] }
  const [liveCommandCache, setLiveCommandCache] = useState<Record<string, string[]>>({});
  // Track last submitted command to throttle accidental repeats
  const lastSubmitRef = useRef<{ cmd: string; ts: number }>({ cmd: '', ts: 0 });
  // Ref lock to prevent duplicate submissions before React state updates propagate
  const inFlightRef = useRef(false);

  // Load settings and history from Supabase or localStorage on mount
  useEffect(() => {
    async function loadUserData() {
      if (user) {
        const settings = await getUserSettings(user.id);
        if (settings) {
          if (settings.llm_provider) setProvider(settings.llm_provider);
        } else {
          // fallback to localStorage
          const local = loadSettings();
          if (local.provider) setProvider(local.provider);
        }
        const history = await getUserChatHistory(user.id);
        if (history && history.length > 0) {
          setMessages(history.map((h: any) => h.message));
        } else {
          setMessages([]);
        }
      } else {
        // Not logged in: use localStorage
        const local = loadSettings();
        if (local.provider) setProvider(local.provider);
        setMessages(loadHistory());
      }
    }
    loadUserData();

    // Sync tokens from Supabase integration accounts to localStorage so the chat bar can use them without separate manual step
    async function syncProviderTokens() {
      if (!user) return;
      try {
        const accounts = await getUserIntegrationAccounts(user.id);
        accounts.forEach((acc: any) => {
          const creds: any = acc?.credentials || {};
          const tok = creds.token || creds.apiKey || creds.api_key || '';
          if (acc.provider && tok) {
            if (acc.provider === 'zapier') {
              localStorage.setItem('zapierApiKey', tok);
            }
            localStorage.setItem(`${acc.provider}_token`, tok);
          }
        });
      } catch (err) {
        console.warn('Could not sync provider tokens:', err);
      }
    }

    syncProviderTokens();
    // eslint-disable-next-line
  }, [user]);

  // Save settings to Supabase/localStorage when provider change
  useEffect(() => {
    if (user) {
      saveUserSettings(user.id, { llm_provider: provider, llm_api_keys: {} });
    } else {
      saveSettings({ provider });
    }
  }, [provider, user]);

  // Save chat history to Supabase/localStorage when messages change
  useEffect(() => {
    if (user) {
      // Only add the latest message (avoid duplicate inserts)
      if (messages.length > 0) {
        const last = messages[messages.length - 1];
        addUserChatMessage(user.id, last);
      }
    } else {
      saveHistory(messages);
    }
    // eslint-disable-next-line
  }, [messages]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  // Build base commands list (static + live fetched ones)
  const buildAllCommands = () => {
    const result: { provider: string; command: string }[] = [];
    for (const prov of PROVIDERS) {
      const cmds = [...prov.commands, ...(liveCommandCache[prov.id] || [])];
      for (const c of cmds) {
        result.push({ provider: prov.name, command: `/${prov.id} ${c}` });
      }
    }
    return result;
  };

  // Pre-calc list of valid provider IDs to avoid unnecessary Supabase queries
  const VALID_PROVIDER_IDS = React.useMemo(() => PROVIDERS.map(p => p.id), []);

  // Fetch live commands for provider prefix if necessary & filter suggestions
  useEffect(() => {
    if (!input.startsWith('/')) {
      setShowCommandSuggestions(false);
      return;
    }

    // Extract provider key (text between '/' and first space or end)
    const match = input.match(/^\/([a-zA-Z0-9_\-]+)/);
    const providerKey = match ? match[1] : '';

    if (providerKey && VALID_PROVIDER_IDS.includes(providerKey) && !liveCommandCache[providerKey]) {
      // Attempt to fetch live commands
      (async () => {
        try {
          const mcpServer = await MCPServerService.getServerById(providerKey);
          if (mcpServer && mcpServer.apiUrl) {
            // Determine token for provider when required (best-effort)
            let token = '';
            if (providerKey === 'github') {
              token = localStorage.getItem('github_token') || '';
              if (!token && user) {
                const rec = await getCredential(user.id, 'github');
                token = rec?.credentials?.token || '';
              }
            } else if (providerKey === 'openai') token = localStorage.getItem('openai_token') || '';
            else if (providerKey === 'anthropic') token = localStorage.getItem('anthropic_token') || '';
            else if (providerKey === 'google_drive') token = googleToken;
            else if (providerKey === 'gmail') token = googleToken;

            const cmds = await fetchMCPCommands(mcpServer.apiUrl, token);
            if (Array.isArray(cmds) && cmds.length > 0) {
              const normalised = cmds.map((c: any) => {
                if (typeof c === 'string') return c.trim();
                if (c && typeof c === 'object') {
                  return (c.id || c.name || '').toString().trim();
                }
                return '';
              }).filter(Boolean);
              if (normalised.length > 0) {
                setLiveCommandCache(prev => ({ ...prev, [providerKey]: normalised }));
              }
            }
          }
        } catch (_) {
          /* silent */
        }
      })();
    }

    const q = input.slice(1).toLowerCase();
    setFilteredCommands(
      buildAllCommands().filter((c) => c.command.toLowerCase().includes(q))
    );
    setShowCommandSuggestions(true);
  }, [input, liveCommandCache]);

  // Persist command history per provider in localStorage for quick recall
  const HISTORY_KEY = `mcp_history_${provider}`;

  // Load history on provider change
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setCommandHistory(Array.isArray(stored) ? stored : []);
    } catch {
      setCommandHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleSend = async () => {
    // Prevent double submission: use a synchronous ref in addition to React state
    if (inFlightRef.current || loading) return;
    inFlightRef.current = true;
    if (!input.trim()) return;

    // Throttle identical submits within 1 second
    const now = Date.now();
    if (
      lastSubmitRef.current.cmd === input.trim() &&
      now - lastSubmitRef.current.ts < 1000
    ) {
      return;
    }
    lastSubmitRef.current = { cmd: input.trim(), ts: now };

    let processedInput = input;
    // Generic: if user typed a command slug without leading /provider, prepend automatically
    if (!processedInput.startsWith('/')) {
      const maybeCmd = processedInput.toLowerCase().trim().replace(/\s+/g, '-');
      const matchProv = PROVIDERS.find(p => p.commands.includes(maybeCmd));
      if (matchProv) {
        processedInput = `/${matchProv.id} ${maybeCmd}`;
      }
    }
    // Drive & Gmail intent detection
    const maybeDrive = parseDriveIntent(processedInput);
    if (maybeDrive) processedInput = maybeDrive;
    const maybeGmail = parseGmailIntent(processedInput);
    if (maybeGmail) processedInput = maybeGmail;
    setCommandHistory(prev => {
      const next = [...prev, processedInput].slice(-50); // cap at 50
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    setHistoryIndex(null);
    setMessages([...messages, { role: 'user', content: processedInput }]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      // --- GitHub Chat Commands ---
      const githubIntent = parseGithubIntent(processedInput);
      if (processedInput.startsWith('/github') || githubIntent) {
        const rawCmd = processedInput.startsWith('/github') ? processedInput : (githubIntent as string);
        let cmdBody = rawCmd.replace(/^\/github\s*/i, '').toLowerCase().trim();
        // Special handling for "create repo <name>"
        const createRepoMatch = cmdBody.match(/^create\s+repo\s+(.+)/);
        if (createRepoMatch) {
          cmdBody = `create-repo ${createRepoMatch[1].trim()}`;
        } else {
          // General conversions: if starts with two words that form a known slug (e.g., "list repos" -> "list-repos")
          const twoWord = cmdBody.match(/^(\w+)\s+(\w+)(.*)$/);
          if (twoWord) {
            const [, w1, w2, rest] = twoWord;
            const slug = `${w1}-${w2}`;
            cmdBody = rest ? `${slug}${rest}` : slug;
          }
          // Replace multiple spaces inside args with single spaces
          cmdBody = cmdBody.replace(/\s+/g, ' ').trim();
        }
        // Use MCP protocol for GitHub commands
        let githubToken = localStorage.getItem('github_token') || '';
        if (!githubToken && user) {
          const rec = await getCredential(user.id, 'github');
          githubToken = rec?.credentials?.token || '';
        }
        if (!githubToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please enter your GitHub Personal Access Token in the Integrations panel.' }]);
          setLoading(false);
          return;
        }
        // Get MCP server for GitHub
        const server = await MCPServerService.getServerById('github');
        if (!server || !server.apiUrl) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'GitHub MCP server not found.' }]);
          setLoading(false);
          return;
        }
        try {
          // Try to match command slug with server-exposed commands to handle kebab vs snake_case
          let finalCmd = cmdBody;
          if (!liveCommandCache['github']) {
            try {
              const cmds = await fetchMCPCommands(server.apiUrl, githubToken);
              setLiveCommandCache(prev => ({ ...prev, github: Array.isArray(cmds) ? cmds : [] }));
            } catch {}
          }
          const available = liveCommandCache['github'] || [];
          if (available.length > 0 && !available.includes(finalCmd)) {
            const variants = [
              finalCmd.replace(/-/g, '_'),
              finalCmd.replace(/_/g, '-'),
              finalCmd.split(' ').join('-'),
              finalCmd.split(' ').join('_'),
            ];
            const matched = variants.find(v => available.includes(v));
            if (matched) {
              finalCmd = matched;
            }
          }

          const result = await runMCPCommand(server.apiUrl, githubToken, finalCmd, {}, 'github');
          setMessages(prev => [...prev, { role: 'assistant', content: prettyPrintResult('github', result) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run GitHub command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- End GitHub Chat Commands ---
      // --- Google Drive Chat Commands ---
      if (processedInput.startsWith('/drive') || processedInput.startsWith('/google_drive')) {
        // Normalize the command by stripping the prefix and converting common phrases to kebab-case slugs
        const rawDrive = processedInput.replace(/^\/(drive|google_drive)\s*/i, '').trim();
        let driveCmd = rawDrive.toLowerCase();

        // Explicit alias mapping for frequent actions
        if (driveCmd === 'list files' || driveCmd === 'list my files' || driveCmd === 'list drive files') {
          driveCmd = 'list-files';
        } else {
          // Generic conversion: first two words → kebab-case slug (e.g. "upload file" => "upload-file")
          const twoWord = driveCmd.match(/^(\w+)\s+(\w+)(.*)$/);
          if (twoWord) {
            const [, w1, w2, rest] = twoWord;
            const slug = `${w1}-${w2}`;
            driveCmd = rest ? `${slug}${rest}`.trim() : slug;
          }
          driveCmd = driveCmd.replace(/\s+/g, ' ').trim();
        }

        // Only use Supabase session provider_token if it looks like a Google OAuth access token
        const maybeGoogleTok = googleToken && googleToken.startsWith('ya29') ? googleToken : '';
        let driveToken: string = localStorage.getItem('google_drive_token') || localStorage.getItem('gmail_token') || maybeGoogleTok;
        if (!driveToken && user) {
          try {
            const rec = await getCredential(user.id, 'google_drive');
            driveToken = rec?.credentials?.token || rec?.credentials?.accessToken || '';
          } catch {}
        }

        if (!driveToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please connect your Google account in Integrations first.' }]);
          setLoading(false);
          return;
        }

        // Route to MCP server for Drive
        const server = await MCPServerService.getServerById('google_drive');
        if (!server || !server.apiUrl) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Google Drive MCP server not found.' }]);
          setLoading(false);
          return;
        }
        try {
          const result = await runMCPCommand(server.apiUrl, driveToken, driveCmd, {}, 'google_drive');
          setMessages(prev => [...prev, { role: 'assistant', content: prettyPrintResult('google_drive', result) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run Drive command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- Gmail Chat Commands ---
      if (processedInput.startsWith('/gmail') || maybeGmail) {
        const rawGmail = processedInput.startsWith('/gmail') ? processedInput : (maybeGmail || processedInput);
        const cleanGmailCmd = rawGmail.replace(/^\/gmail\s*/i, '').trim().toLowerCase();
        // Map common aliases to canonical backend commands
        let gmailCmd = cleanGmailCmd;

        // Alias: "get email <id>" → "get-message <id>"
        const getEmailMatch = gmailCmd.match(/^get email\s+(\S+)/);
        if (getEmailMatch) {
          gmailCmd = `get-message ${getEmailMatch[1]}`;
        }

        // Common phrases meaning list inbox / recent messages
        const listAliases = [
          'list inbox', 'list emails', 'list messages',
          'recent emails', 'get recent emails', 'recent messages', 'get recent messages',
          'get emails', 'get inbox', 'recent inbox'
        ];
        if (listAliases.includes(gmailCmd)) {
          gmailCmd = 'list-messages';
        }

        // If user typed get-message without an ID, prompt for correct usage
        if (gmailCmd === 'get-message') {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please specify the Gmail message ID: e.g. /gmail get-message <id>' }]);
          setLoading(false);
          return;
        }

        const maybeGoogleTok2 = googleToken && googleToken.startsWith('ya29') ? googleToken : '';
        let gmailToken: string = localStorage.getItem('gmail_token') || localStorage.getItem('google_drive_token') || maybeGoogleTok2;
        if (!gmailToken && user) {
          try {
            const rec = await getCredential(user.id, 'gmail');
            gmailToken = rec?.credentials?.token || rec?.credentials?.accessToken || '';
          } catch {}
        }

        if (!gmailToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please connect your Gmail account in Integrations first.' }]);
          setLoading(false);
          return;
        }

        // Route to MCP server for Gmail
        const server = await MCPServerService.getServerById('gmail');
        if (!server || !server.apiUrl) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Gmail MCP server not found.' }]);
          setLoading(false);
          return;
        }
        try {
          const result = await runMCPCommand(server.apiUrl, gmailToken as string, gmailCmd, {}, 'gmail');

          // If we listed messages but there is no subject/snippet, fetch details for first 10 to show subjects
          if (gmailCmd === 'list-messages' && Array.isArray(result) && result.length > 0 && (!('subject' in result[0]) && !('snippet' in result[0]))) {
            const ids = result.slice(0, 10).map((m: any) => m.id).filter(Boolean);
            try {
              const detailed = await Promise.all(ids.map(async (mid: string) => {
                try {
                  const det = await runMCPCommand(server.apiUrl, gmailToken as string, `get-message ${mid}`, {}, 'gmail');
                  const d: any = det as any;
                  return { id: mid, subject: d.subject || d.snippet || '(no subject)' };
                } catch {
                  return { id: mid, subject: '(error fetching details)' };
                }
              }));
              // merge subjects back into original list
              const merged = result.map((m: any) => {
                const found = detailed.find(d => d.id === m.id);
                return found ? { ...m, subject: found.subject } : m;
              });
              const pretty = prettyPrintResult('gmail', merged);
              setMessages(prev => [...prev, { role: 'assistant', content: pretty }]);
            } catch {
              setMessages(prev => [...prev, { role: 'assistant', content: prettyPrintResult('gmail', result) }]);
            }
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: prettyPrintResult('gmail', result) }]);
          }
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run Gmail command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- Zapier Chat Commands (AI Actions / NLA) ---
      if (processedInput.startsWith('/zapier')) {
        const cleanZapierCmdRaw = processedInput.replace(/^\/zapier\s*/i, '').trim();
        // Backend expects kebab-case slugs (e.g. list-zaps, trigger-zap-<id>)
        const cleanZapierCmd = cleanZapierCmdRaw.toLowerCase().replace(/\s+/g, '-');
        const zapierToken = localStorage.getItem('zapierApiKey') || localStorage.getItem('zapier_token') || '';
        if (!zapierToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please enter your Zapier API Key in the Integrations panel.' }]);
          setLoading(false);
          return;
        }

        // Route to MCP server for Zapier (NLA)
        const server = await MCPServerService.getServerById('zapier');
        if (!server || !server.apiUrl) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Zapier MCP server not found.' }]);
          setLoading(false);
          return;
        }
        try {
          const result = await runMCPCommand(server.apiUrl, zapierToken, cleanZapierCmd, {}, 'zapier');
          setMessages(prev => [...prev, { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run Zapier command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- End Google Drive Chat Commands ---
      // --- OpenAI MCP Command Routing ---
      if (processedInput.startsWith('/openai')) {
        // Use MCP protocol for OpenAI commands
        const openaiToken = localStorage.getItem('openai_token') || '';
        if (!openaiToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please enter your OpenAI API key in the Integrations panel.' }]);
          setLoading(false);
          return;
        }
        // Get MCP server for OpenAI
        const server = await MCPServerService.getServerById('openai');
        if (!server || !server.apiUrl) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'OpenAI MCP server not found.' }]);
          setLoading(false);
          return;
        }
        try {
          const result = await runMCPCommand(server.apiUrl, openaiToken, processedInput, {});
          setMessages(prev => [...prev, { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run OpenAI command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- End OpenAI MCP Command Routing ---
      // --- Drive intent recognition ---
      const key = localStorage.getItem(`${provider}_token`);
      if (!key) {
        setError('Please add an account in the provider portal.');
        setLoading(false);
        return;
      }
      const assistantMsg = await callLLMProvider({
        provider,
        messages: [
          ...messages,
          { role: 'user', content: processedInput },
        ],
        apiKeys: {
          openai: localStorage.getItem(`${provider}_token`) || undefined,
          anthropic: localStorage.getItem(`${provider}_token`) || undefined,
          google: localStorage.getItem(`${provider}_token`) || undefined,
        },
      });
      // Try to parse the assistant's message as JSON for marketplace filters
      let parsed: any = null;
      try {
        parsed = JSON.parse(assistantMsg);
      } catch {}
      if (parsed && (parsed.category || parsed.tags || parsed.pricing)) {
        // If the response is a filter object, set filters in context
        setFilters(parsed);
      }
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === assistantMsg) {
          return prev;
        }
        return [...prev, { role: 'assistant', content: assistantMsg }];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
      inFlightRef.current = false; // release lock
    }
  };

  // Handle up/down arrow for command history
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      if (commandHistory.length === 0) return;
      // Only trigger if cursor is at start
      const target = e.target as HTMLInputElement;
      if (target.selectionStart !== 0 || target.selectionEnd !== 0) return;
      e.preventDefault();
      setHistoryIndex(idx => {
        const newIndex = idx === null ? commandHistory.length - 1 : Math.max(0, idx - 1);
        setInput(commandHistory[newIndex] || '');
        return newIndex;
      });
    } else if (e.key === 'ArrowDown') {
      if (commandHistory.length === 0) return;
      // Only trigger if cursor is at end
      const target = e.target as HTMLInputElement;
      if (target.selectionStart !== target.value.length || target.selectionEnd !== target.value.length) return;
      e.preventDefault();
      setHistoryIndex(idx => {
        if (idx === null) return null;
        const newIndex = Math.min(commandHistory.length - 1, idx + 1);
        setInput(commandHistory[newIndex] || '');
        if (newIndex === commandHistory.length - 1) return null;
        return newIndex;
      });
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvider(e.target.value as LLMProvider);
  };

  // Handle suggestion click (re-added after refactor)
  const handleSuggestionClick = (cmd: string) => {
    setInput(cmd + ' ');
    setShowCommandSuggestions(false);
    inputRef.current?.focus();
  };

  const handleClearHistory = async () => {
    setMessages([]);
    setCommandHistory([]);
    saveHistory([]);
    // Optionally clear from backend
    if (user) {
      try {
        await addUserChatMessage(user.id, [] as any);
      } catch {}
    }
  };

  return (
    <div className="relative">
      <div className={`w-full h-full mx-auto rounded-xl border shadow-md p-6 flex flex-col space-y-6 ${darkMode ? 'bg-[#1f1f1f] border-zinc-700 text-white' : 'bg-white border-gray-200 text-black'}`}>
        <div className="flex items-center space-x-2 mb-2">
          <label className={`text-sm font-medium ${darkMode ? 'text-zinc-200' : 'text-gray-700'}`}>Provider:</label>
          <select value={provider} onChange={handleProviderChange} className={`border rounded-lg px-2 py-1 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700' : 'border-gray-300'}`}>
            {PROVIDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className={`ml-auto text-xs underline ${darkMode ? 'text-red-400 hover:text-red-500' : 'text-red-600 hover:text-red-700'}`}
            >
              Clear history
            </button>
          )}
        </div>
        <div ref={scrollerRef} className="flex-1 overflow-y-auto space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                msg.role === 'user'
                  ? (darkMode ? 'bg-blue-600 text-white self-end ml-auto' : 'bg-blue-100 text-blue-900 self-end ml-auto')
                  : (darkMode ? 'bg-zinc-700 text-zinc-200 self-start mr-auto' : 'bg-gray-100 text-gray-800 self-start mr-auto')
              }`}
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: typeof msg.content === 'string' && /^{|^\[/.test(msg.content.trim()) ? 'monospace' : undefined,
              }}
            >
              {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
            </div>
          ))}
          {loading && (
            <>
              <div className="w-full h-1 bg-blue-100 relative overflow-hidden rounded">
                <div className="absolute inset-0 w-full h-full bg-blue-500 animate-pulse" style={{ animationDuration: '1.2s' }} />
              </div>
              <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm inline-block">Processing…</div>
            </>
          )}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm inline-block">{error}</div>
          )}
        </div>
        <form
          className="flex items-center space-x-2 mt-2"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setHistoryIndex(null); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your message..."
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-black text-white border-zinc-700 placeholder-zinc-400' : 'bg-white text-black border-gray-300 placeholder-gray-400'}`}
            autoComplete="off"
          />
          {showCommandSuggestions && filteredCommands.length > 0 && (
            <div className={`absolute left-0 right-0 mt-1 rounded shadow-lg z-50 max-h-60 overflow-y-auto
              ${darkMode ? 'bg-zinc-800 border border-zinc-600 text-white' : 'bg-white border border-gray-300 text-black'}`}
            >
              {filteredCommands.map((c, i) => (
                <div
                  key={c.command + i}
                  className={`px-4 py-2 cursor-pointer text-sm flex flex-col ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(c.command); }}
                >
                  <span className="font-semibold">{c.command}</span>
                  <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{c.provider}</span>
                </div>
              ))}
            </div>
          )}
          <Button type="submit" className="px-4 py-2" disabled={loading}>Send</Button>
        </form>
        {/* Command history dropdown (if you want to show it, e.g. below the input) */}
        {historyIndex !== null && commandHistory.length > 0 && (
          <div className={`absolute bottom-full left-0 w-full rounded z-50
            ${darkMode
              ? 'bg-zinc-900 text-white shadow-lg border border-zinc-700'
              : 'bg-white text-black shadow border border-gray-300'
            }`}
            style={{ maxHeight: 200, overflowY: 'auto' }}
          >
            {commandHistory.map((cmd, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 cursor-pointer text-sm
                  ${historyIndex === idx
                    ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-200 text-black')
                    : ''}`}
                onMouseDown={() => {
                  setInput(cmd);
                  setHistoryIndex(idx);
                }}
              >
                {cmd}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 