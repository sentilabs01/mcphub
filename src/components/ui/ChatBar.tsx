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
import { runMCPCommand } from '../../services/mcpApiService';
import { jwtDecode } from 'jwt-decode';

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
function parseGithubIntent(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('list repos') || lower.includes('show my repos')) return 'list repos';
  const issuesMatch = lower.match(/list issues for ([\w-]+\/[\w-]+)/);
  if (issuesMatch) {
    return `issues ${issuesMatch[1]}`;
  }
  const createIssueMatch = lower.match(/create issue in ([\w-]+\/[\w-]+) titled "([^"]+)" with body "([^"]+)"/);
  if (createIssueMatch) {
    const [, repo, title, body] = createIssueMatch;
    return `create issue ${repo} "${title}" "${body}"`;
  }
  const pullsMatch = lower.match(/list pull requests for ([\w-]+\/[\w-]+)/);
  if (pullsMatch) {
    return `pulls ${pullsMatch[1]}`;
  }
  // Add more patterns as needed
  return input; // fallback: send as-is
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
  const googleToken = session?.provider_token || '';
  // Command history state
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

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

  // Build all commands from PROVIDERS
  const allCommands = PROVIDERS.flatMap((provider) =>
    provider.commands.map((command) => ({ provider: provider.name, command: `/${provider.id} ${command}` }))
  );

  // Show suggestions when input starts with '/'
  useEffect(() => {
    if (input.startsWith('/')) {
      const q = input.slice(1).toLowerCase();
      setFilteredCommands(
        allCommands.filter((c) => c.command.toLowerCase().includes(q))
      );
      setShowCommandSuggestions(true);
    } else {
      setShowCommandSuggestions(false);
    }
  }, [input]);

  // Handle suggestion click
  const handleSuggestionClick = (cmd: string) => {
    setInput(cmd + ' ');
    setShowCommandSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(null);
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      // --- GitHub Chat Commands ---
      if (provider === 'github' || input.startsWith('/github')) {
        const parsed = parseGithubIntent(input);
        // Use MCP protocol for GitHub commands
        const githubToken = localStorage.getItem('github_token') || '';
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
          const result = await runMCPCommand(server.apiUrl, githubToken, parsed, {});
          setMessages(prev => [...prev, { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run GitHub command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- End GitHub Chat Commands ---
      // --- Google Drive Chat Commands ---
      if (input.startsWith('/drive')) {
        if (!googleToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please sign in with Google to use Drive commands.' }]);
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
          const result = await runMCPCommand(server.apiUrl, googleToken, input.trim(), {});
          setMessages(prev => [...prev, { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run Drive command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- Gmail Chat Commands ---
      if (input.startsWith('/gmail')) {
        if (!googleToken) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Please sign in with Google to use Gmail commands.' }]);
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
          const result = await runMCPCommand(server.apiUrl, googleToken, input.trim(), {});
          setMessages(prev => [...prev, { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run Gmail command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- End Google Drive Chat Commands ---
      // --- OpenAI MCP Command Routing ---
      if (input.startsWith('/openai')) {
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
          const result = await runMCPCommand(server.apiUrl, openaiToken, input, {});
          setMessages(prev => [...prev, { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]);
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Failed to run OpenAI command.' }]);
        }
        setLoading(false);
        return;
      }
      // --- End OpenAI MCP Command Routing ---
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
          { role: 'user', content: input },
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
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
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

  return (
    <div className="relative">
      <div className={`w-full max-w-xl mx-auto rounded-xl border shadow-md p-4 flex flex-col space-y-4 ${darkMode ? 'bg-[#232323] border-zinc-700 text-white' : 'bg-white border-gray-200 text-black'}`}>
        <div className="flex items-center space-x-2 mb-2">
          <label className={`text-sm font-medium ${darkMode ? 'text-zinc-200' : 'text-gray-700'}`}>Provider:</label>
          <select value={provider} onChange={handleProviderChange} className={`border rounded-lg px-2 py-1 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700' : 'border-gray-300'}`}>
            {PROVIDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div ref={scrollerRef} className="flex-1 overflow-y-auto max-h-64 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-100 text-blue-900 self-end ml-auto'
                  : 'bg-gray-100 text-gray-800 self-start mr-auto'
              }`}
              style={{ display: idx >= messages.length - 3 ? 'block' : 'none' }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm inline-block">Thinking...</div>
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
            <div className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredCommands.map((c, i) => (
                <div
                  key={c.command + i}
                  className="px-4 py-2 cursor-pointer hover:bg-zinc-800 text-sm flex flex-col"
                  onClick={() => handleSuggestionClick(c.command)}
                >
                  <span className="font-semibold">{c.command}</span>
                  <span className="text-xs text-zinc-400">{c.provider}</span>
                </div>
              ))}
            </div>
          )}
          <Button type="submit" className="px-4 py-2">Send</Button>
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