import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { fetchUserRepos } from '../../services/githubService';
import { listDriveFiles, listGmailMessages } from '../../services/googleService';
import { listSlackChannels } from '../../services/slackService';
import { triggerZapierWebhook } from '../../services/zapierService';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserIntegrationAccounts,
  addUserIntegrationAccount,
  updateUserIntegrationAccount,
  deleteUserIntegrationAccount,
} from '../../services/userIntegrationAccountsService';
import { PROVIDER_COMMANDS } from '../../utils/providerCommands';
import { useChatBarInput } from '../../context/ChatBarInputContext';
import { safeSet, safeRemove } from '../../utils/safeLocal';
import { splitMcpEndpoint } from '../../utils/zapier';

// Static URLs for automation connectors
const MAKE_APP_JSON_URL = '/integrations/makecom/mcp-app.json';
const N8N_NPM_URL = 'https://www.npmjs.com/package/n8n-nodes-mcp';
const ZAPIER_INVITE_URL = 'https://example.com/zapier-invite'; // TODO replace with real

export const Integrations: React.FC<{ darkMode?: boolean; selectedProvider?: string }> = ({ darkMode, selectedProvider }) => {
  const { user } = useAuth();
  const { setInput } = useChatBarInput();
  // State for all accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  // State for new account inputs
  const [newGithubToken, setNewGithubToken] = useState('');
  const [newGithubLabel, setNewGithubLabel] = useState('');
  const [newDriveToken, setNewDriveToken] = useState('');
  const [newDriveLabel, setNewDriveLabel] = useState('');
  const [newGmailToken, setNewGmailToken] = useState('');
  const [newGmailLabel, setNewGmailLabel] = useState('');
  const [newAnthropicToken, setNewAnthropicToken] = useState('');
  const [newOpenAIToken, setNewOpenAIToken] = useState('');
  const [newGeminiToken, setNewGeminiToken] = useState('');
  const [newSlackToken, setNewSlackToken] = useState('');
  // State for active account IDs
  const [activeGithubId, setActiveGithubId] = useState<string | null>(null);
  const [activeDriveId, setActiveDriveId] = useState<string | null>(null);
  const [activeGmailId, setActiveGmailId] = useState<string | null>(null);
  const [activeAnthropicId, setActiveAnthropicId] = useState<string | null>(null);
  const [activeOpenAIId, setActiveOpenAIId] = useState<string | null>(null);
  const [activeGeminiId, setActiveGeminiId] = useState<string | null>(null);
  const [activeSlackId, setActiveSlackId] = useState<string | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<{ [provider: string]: string }>({});

  // Load accounts and active IDs on mount/user change
  useEffect(() => {
    async function load() {
      if (user) {
        const accs = await getUserIntegrationAccounts(user.id);
        setAccounts(accs);
        setActiveGithubId(localStorage.getItem('activeGithubId'));
        setActiveDriveId(localStorage.getItem('activeDriveId'));
        setActiveGmailId(localStorage.getItem('activeGmailId'));
        setActiveAnthropicId(localStorage.getItem('activeAnthropicId'));
        setActiveOpenAIId(localStorage.getItem('activeOpenAIId'));
        setActiveGeminiId(localStorage.getItem('activeGeminiId'));
        setActiveSlackId(localStorage.getItem('activeSlackId'));
      }
    }
    load();
  }, [user]);

  // Add new account handlers
  const handleAddAccount = async (provider: string, token: string) => {
    if (!user || !token) return;
    const newAcc = await addUserIntegrationAccount(user.id, provider, '', { token });
    if (newAcc) setAccounts(prev => [...prev, newAcc]);
    if (provider === 'github') {
      setNewGithubToken('');
    } else if (provider === 'google_drive') {
      setNewDriveToken('');
    } else if (provider === 'gmail') {
      setNewGmailToken('');
    } else if (provider === 'anthropic') {
      setNewAnthropicToken('');
    } else if (provider === 'openai') {
      setNewOpenAIToken('');
    } else if (provider === 'google') {
      setNewGeminiToken('');
    } else if (provider === 'slack') {
      setNewSlackToken('');
    }
  };

  // Remove account handler
  const handleRemoveAccount = async (id: string) => {
    await deleteUserIntegrationAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (activeGithubId === id) setActiveGithubId(null);
    if (activeDriveId === id) setActiveDriveId(null);
    if (activeGmailId === id) setActiveGmailId(null);
    if (activeAnthropicId === id) setActiveAnthropicId(null);
    if (activeOpenAIId === id) setActiveOpenAIId(null);
    if (activeGeminiId === id) setActiveGeminiId(null);
    if (activeSlackId === id) setActiveSlackId(null);
  };

  // Set active account handler
  const handleSetActive = (provider: string, id: string) => {
    let token = '';
    console.log('Setting active account:', { provider, id });
    if (provider === 'github') {
      setActiveGithubId(id);
      safeSet('activeGithubId', id);
      token = accounts.find(a => a.provider === 'github' && a.id === id)?.credentials?.token || '';
      console.log('Saving githubToken:', token);
      safeSet('githubToken', token);
    } else if (provider === 'google_drive') {
      setActiveDriveId(id);
      safeSet('activeDriveId', id);
      token = accounts.find(a => a.provider === 'google_drive' && a.id === id)?.credentials?.token || '';
      console.log('Saving googleToken:', token);
      safeSet('googleToken', token);
    } else if (provider === 'gmail') {
      setActiveGmailId(id);
      safeSet('activeGmailId', id);
      token = accounts.find(a => a.provider === 'gmail' && a.id === id)?.credentials?.token || '';
      console.log('Saving gmailToken:', token);
      safeSet('gmailToken', token);
    } else if (provider === 'anthropic') {
      setActiveAnthropicId(id);
      safeSet('activeAnthropicId', id);
      token = accounts.find(a => a.provider === 'anthropic' && a.id === id)?.credentials?.token || '';
      console.log('Saving anthropic_token:', token);
      safeSet('anthropic_token', token);
    } else if (provider === 'openai') {
      setActiveOpenAIId(id);
      safeSet('activeOpenAIId', id);
      token = accounts.find(a => a.provider === 'openai' && a.id === id)?.credentials?.token || '';
      console.log('Saving openai_token:', token);
      safeSet('openai_token', token);
    } else if (provider === 'google') {
      setActiveGeminiId(id);
      safeSet('activeGeminiId', id);
      token = accounts.find(a => a.provider === 'google' && a.id === id)?.credentials?.token || '';
      console.log('Saving google_token:', token);
      safeSet('google_token', token);
    } else if (provider === 'slack') {
      setActiveSlackId(id);
      safeSet('activeSlackId', id);
      token = accounts.find(a => a.provider === 'slack' && a.id === id)?.credentials?.token || '';
      // Only persist to localStorage if it looks like a Slack bot/app token to avoid accidental GitHub PAT overwrite
      if (token.startsWith('xoxb-') || token.startsWith('xapp-1-')) {
        console.log('Saving slack_token:', token);
        safeSet('slack_token', token);
      } else {
        console.warn('[Integrations] Not saving slack_token, value does not look like Slack token');
      }
    }
  };

  // Filter accounts by provider
  const githubAccounts = accounts.filter(a => a.provider === 'github');
  const driveAccounts = accounts.filter(a => a.provider === 'google_drive');
  const gmailAccounts = accounts.filter(a => a.provider === 'gmail');
  const anthropicAccounts = accounts.filter(a => a.provider === 'anthropic');
  const openaiAccounts = accounts.filter(a => a.provider === 'openai');
  const geminiAccounts = accounts.filter(a => a.provider === 'google');
  const slackAccounts = accounts.filter(a => a.provider === 'slack');

  // Get active tokens
  const activeGithubToken = githubAccounts.find(a => a.id === activeGithubId)?.credentials?.token || '';
  const activeDriveToken = driveAccounts.find(a => a.id === activeDriveId)?.credentials?.token || '';
  const activeGmailToken = gmailAccounts.find(a => a.id === activeGmailId)?.credentials?.token || '';
  const activeAnthropicToken = anthropicAccounts.find(a => a.id === activeAnthropicId)?.credentials?.token || '';
  const activeOpenAIToken = openaiAccounts.find(a => a.id === activeOpenAIId)?.credentials?.token || '';
  const activeGeminiToken = geminiAccounts.find(a => a.id === activeGeminiId)?.credentials?.token || '';
  const activeSlackToken = slackAccounts.find(a => a.id === activeSlackId)?.credentials?.token || '';

  // Zapier
  const [zapierUrl, setZapierUrl] = useState('');
  const [zapierResult, setZapierResult] = useState('');

  // GitHub
  const [githubResult, setGithubResult] = useState('');
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);

  // Google
  const [googleResult, setGoogleResult] = useState('');
  const [googleFiles, setGoogleFiles] = useState<any[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Gmail
  const [gmailResult, setGmailResult] = useState('');
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);

  // Make.com credentials
  const [makeBaseUrl, setMakeBaseUrl] = useState<string>(() => localStorage.getItem('makeBaseUrl') || '');
  const [makeApiKey, setMakeApiKey] = useState<string>(() => localStorage.getItem('makeApiKey') || '');

  const handleSaveMakeCreds = () => {
    safeSet('makeBaseUrl', makeBaseUrl);
    safeSet('makeApiKey', makeApiKey);
  };

  // Zapier NLA (AI Actions) – API Key stored locally
  const [zapierApiKey, setZapierApiKey] = useState<string>(() => localStorage.getItem('zapierApiKey') || '');
  const handleSaveZapierApiKey = () => {
    safeSet('zapierApiKey', zapierApiKey);
  };

  // Zapier Private App – Base URL + API Key stored locally
  const [zapierBaseUrl, setZapierBaseUrl] = useState<string>(() => localStorage.getItem('zapierBaseUrl') || '');
  const [zapierPrivKey, setZapierPrivKey] = useState<string>(() => localStorage.getItem('zapierPrivKey') || '');
  const handleSaveZapierPrivCreds = () => {
    safeSet('zapierBaseUrl', zapierBaseUrl);
    safeSet('zapierPrivKey', zapierPrivKey);
  };

  // n8n credentials
  const [n8nBaseUrl, setN8nBaseUrl] = useState<string>(() => localStorage.getItem('n8nBaseUrl') || '');
  const [n8nApiKey, setN8nApiKey] = useState<string>(() => localStorage.getItem('n8nApiKey') || '');

  const handleSaveN8nCreds = () => {
    safeSet('n8nBaseUrl', n8nBaseUrl);
    safeSet('n8nApiKey', n8nApiKey);
  };

  // Save GitHub token
  const handleGithubTokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setNewGithubToken(token);
    if (user) {
      const accounts = await getUserIntegrationAccounts(user.id);
      const github = accounts.find((a: any) => a.provider === 'github');
      if (github) {
        await updateUserIntegrationAccount(github.id, { token });
      } else {
        await addUserIntegrationAccount(user.id, 'github', 'default', { token });
      }
    }
  };

  // Save Google token
  const handleGoogleTokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setNewDriveToken(token);
    if (user) {
      const accounts = await getUserIntegrationAccounts(user.id);
      const google = accounts.find((a: any) => a.provider === 'google_drive');
      if (google) {
        await updateUserIntegrationAccount(google.id, { token });
      } else {
        await addUserIntegrationAccount(user.id, 'google_drive', 'default', { token });
      }
    }
  };

  // Handlers (to be implemented)
  const handleZapierTrigger = async () => {
    if (!zapierUrl) return;
    setZapierResult('');
    try {
      await triggerZapierWebhook(zapierUrl, {
        source: 'MCP Messenger',
        triggeredAt: new Date().toISOString(),
      });
      setZapierResult('✅ Zap triggered successfully!');
    } catch (err: any) {
      setZapierResult(`❌ ${err.message || 'Failed to trigger Zap'}`);
    }
  };

  const handleGithubFetch = async () => {
    setGithubLoading(true);
    setGithubResult('');
    setGithubRepos([]);
    try {
      const repos = await fetchUserRepos(activeGithubToken);
      if (repos.length === 0) {
        setGithubResult('No repositories found or invalid token.');
      } else {
        setGithubRepos(repos);
        setGithubResult('');
      }
    } catch (err: any) {
      setGithubResult('Error fetching repos.');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGoogleList = async () => {
    setGoogleLoading(true);
    setGoogleResult('');
    setGoogleFiles([]);
    try {
      const files = await listDriveFiles(activeDriveToken);
      if (files.length === 0) {
        setGoogleResult('No files found or invalid token.');
      } else {
        setGoogleFiles(files);
        setGoogleResult('');
      }
    } catch (err) {
      setGoogleResult('Error fetching files.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGmailList = async () => {
    setGmailLoading(true);
    setGmailResult('');
    setGmailMessages([]);
    try {
      const messages = await listGmailMessages(activeGmailToken);
      if (messages.length === 0) {
        setGmailResult('No emails found or invalid token.');
      } else {
        setGmailMessages(messages);
        setGmailResult('');
      }
    } catch (err) {
      setGmailResult('Error fetching emails.');
    } finally {
      setGmailLoading(false);
    }
  };

  // Helper to show partial token
  const partialToken = (token: string) => token ? token.slice(0, 4) + '...' + token.slice(-4) : '';

  // Add new state hooks after zapierApiKey within Zapier integration section
  const [zapierMcpEndpoint, setZapierMcpEndpoint] = useState<string>(() => localStorage.getItem('zapier_mcp_endpoint') || '');
  const [zapierMcpFeedback, setZapierMcpFeedback] = useState<string | null>(null);

  const handleSaveZapierMcpEndpoint = () => {
    if (!zapierMcpEndpoint.trim()) return;
    setZapierMcpFeedback(null);
    try {
      const parsed = splitMcpEndpoint(zapierMcpEndpoint.trim());
      if (!parsed) throw new Error('Endpoint format should be https://.../mcp/<token>');
      safeSet('zapier_mcp_endpoint', zapierMcpEndpoint.trim());
      safeSet('zapier_mcp_url', parsed.base);
      safeSet('zapier_mcp_token', parsed.token);
      setZapierMcpFeedback('Saved!');
    } catch (err: any) {
      setZapierMcpFeedback(err.message || 'Failed to save');
    }
  };

  // Slack
  const [slackResult, setSlackResult] = useState('');
  const [slackChannels, setSlackChannels] = useState<any[]>([]);
  const [slackLoading, setSlackLoading] = useState(false);

  const handleSlackList = async () => {
    setSlackLoading(true);
    setSlackResult('');
    setSlackChannels([]);
    try {
      const ch = await listSlackChannels(activeSlackToken);
      if (!ch || ch.length === 0) {
        setSlackResult('No channels found or invalid token.');
      } else {
        setSlackChannels(ch);
      }
    } catch (err) {
      setSlackResult('Error fetching channels.');
    } finally {
      setSlackLoading(false);
    }
  };

  // Save Slack token (local & backend account)
  const handleSlackTokenChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = e.target.value;
    setNewSlackToken(token);
    if (user) {
      const accounts = await getUserIntegrationAccounts(user.id);
      const slackAcc = accounts.find((a: any) => a.provider === 'slack');
      if (slackAcc) {
        await updateUserIntegrationAccount(slackAcc.id, { token });
      } else {
        await addUserIntegrationAccount(user.id, 'slack', 'default', { token });
      }
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto rounded-xl border shadow-md p-6 flex flex-col space-y-8 mt-8 ${darkMode ? 'bg-[#232323] border-zinc-700 text-white' : 'bg-white border-gray-200 text-black'}`}>
      {/* Zapier */}
      {(!selectedProvider || selectedProvider === 'zapier') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Zapier Integration</h2>
        <p className={`text-xs mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>
          Enter your <b>Zapier Webhook URL</b>.<br />
          <a
            href="https://zapier.com/help/create/code-webhooks/use-webhooks-in-zaps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >How to get a Zapier webhook URL</a>
        </p>
        <input
          type="text"
          value={zapierUrl}
          onChange={e => setZapierUrl(e.target.value)}
          placeholder="Zapier Webhook URL"
          className={`border rounded-lg px-3 py-2 text-sm w-full mb-2 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`}
        />
        <Button onClick={handleZapierTrigger} disabled={!zapierUrl} className={darkMode ? 'bg-blue-700 text-white' : ''}>
          Trigger Zapier Webhook
        </Button>
        {zapierResult && <div className="mt-2 text-sm text-gray-700">{zapierResult}</div>}
        {/* Zapier API Key for AI Actions */}
        <div className="mt-4 space-y-2">
          <input
            type="password"
            value={zapierApiKey}
            onChange={e => setZapierApiKey(e.target.value)}
            placeholder="Zapier API Key (AI Actions)"
            className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`}
          />
          <Button onClick={handleSaveZapierApiKey} disabled={!zapierApiKey} className={darkMode ? 'bg-blue-700 text-white' : ''}>Save API Key Locally</Button>
        </div>
        {/* Zapier MCP Endpoint */}
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={zapierMcpEndpoint}
            onChange={e => setZapierMcpEndpoint(e.target.value)}
            placeholder="Zapier MCP Endpoint (https://actions.zapier.com/mcp/.../sse)"
            className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`}
          />
          <Button onClick={handleSaveZapierMcpEndpoint} disabled={!zapierMcpEndpoint} className={darkMode ? 'bg-blue-700 text-white' : ''}>Save MCP Endpoint</Button>
        </div>
      </div>
      )}

      {/* GitHub Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'github') && (
      <div>
        <h2 className="text-lg font-bold mb-2">GitHub Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newGithubToken} onChange={handleGithubTokenChange} placeholder="GitHub Token" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('github', newGithubToken); setNewGithubToken(''); }} disabled={!newGithubToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Account</Button>
        </div>
        <div className="mb-2">
          {githubAccounts.length > 0 && <div className="text-xs mb-1">Accounts:</div>}
          <ul className="space-y-1">
            {githubAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeGithubId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{acc.account_label} ({partialToken(acc.credentials?.token)})</span>
                <Button size="sm" onClick={() => handleSetActive('github', acc.id)} disabled={activeGithubId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeGithubId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={handleGithubFetch} disabled={!activeGithubToken || githubLoading} className={darkMode ? 'bg-blue-700 text-white' : ''}>{githubLoading ? 'Fetching...' : 'Fetch My Repos'}</Button>
        {githubResult && <div className="mt-2 text-sm text-red-600">{githubResult}</div>}
        {githubRepos.length > 0 && (
          <div className="mt-2 text-sm text-gray-700">
            <b>Your Repositories:</b>
            <ul className="list-disc ml-5 mt-1">
              {githubRepos.map((repo: any) => (
                <li key={repo.id}><a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{repo.full_name}</a></li>
              ))}
            </ul>
          </div>
        )}
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['github'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['github'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, github: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore -- providerCommands entry might be object with commands array */}
              {((PROVIDER_COMMANDS['github'] as any).commands || PROVIDER_COMMANDS['github']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['github'] || '')} disabled={!selectedCommand['github']}>Run</Button>
          </div>
        )}
      </div>
      )}

      {/* Google Drive Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'google_drive') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Google Drive Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newDriveToken} onChange={handleGoogleTokenChange} placeholder="Drive Token" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('google_drive', newDriveToken); setNewDriveToken(''); }} disabled={!newDriveToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Account</Button>
        </div>
        <div className="mb-2">
          {driveAccounts.length > 0 && <div className="text-xs mb-1">Accounts:</div>}
          <ul className="space-y-1">
            {driveAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeDriveId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{acc.account_label} ({partialToken(acc.credentials?.token)})</span>
                <Button size="sm" onClick={() => handleSetActive('google_drive', acc.id)} disabled={activeDriveId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeDriveId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={handleGoogleList} disabled={!activeDriveToken || googleLoading} className={darkMode ? 'bg-blue-700 text-white' : ''}>{googleLoading ? 'Listing...' : 'List My Drive Files'}</Button>
        {googleResult && <div className="mt-2 text-sm text-red-600">{googleResult}</div>}
        {googleFiles.length > 0 && (
          <div className="mt-2 text-sm text-gray-700">
            <b>Your Drive Files:</b>
            <ul className="list-disc ml-5 mt-1">
              {googleFiles.map((file: any) => (
                <li key={file.id}>
                  {file.webViewLink || file.webContentLink ? (
                    <a
                      href={file.webViewLink || file.webContentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      {file.name}
                    </a>
                  ) : (
                    file.name
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['google_drive'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['google_drive'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, google_drive: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore */}
              {((PROVIDER_COMMANDS['google_drive'] as any).commands || PROVIDER_COMMANDS['google_drive']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['google_drive'] || '')} disabled={!selectedCommand['google_drive']}>Run</Button>
          </div>
        )}
      </div>
      )}

      {/* Gmail Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'gmail') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Gmail Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newGmailToken} onChange={e => setNewGmailToken(e.target.value)} placeholder="Gmail Token" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('gmail', newGmailToken); setNewGmailToken(''); }} disabled={!newGmailToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Account</Button>
        </div>
        <div className="mb-2">
          {gmailAccounts.length > 0 && <div className="text-xs mb-1">Accounts:</div>}
          <ul className="space-y-1">
            {gmailAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeGmailId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{partialToken(acc.credentials?.token)}</span>
                <Button size="sm" onClick={() => handleSetActive('gmail', acc.id)} disabled={activeGmailId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeGmailId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={handleGmailList} disabled={!activeGmailToken || gmailLoading} className={darkMode ? 'bg-blue-700 text-white' : ''}>{gmailLoading ? 'Loading...' : 'List My Emails'}</Button>
        {gmailResult && <div className="mt-2 text-sm text-red-600">{gmailResult}</div>}
        {gmailMessages.length > 0 && (
          <div className="mt-2 text-sm text-gray-700">
            <b>Your Emails:</b>
            <ul className="list-disc ml-5 mt-1">
              {gmailMessages.map((msg: any) => {
                const headers = (msg.payload?.headers || []);
                const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
                return (
                  <li key={msg.id} className="mb-2">
                    <div><b>Subject:</b> {getHeader('Subject')}</div>
                    <div><b>From:</b> {getHeader('From')}</div>
                    <div><b>Date:</b> {getHeader('Date')}</div>
                    <div><b>Snippet:</b> {msg.snippet || ''}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['gmail'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['gmail'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, gmail: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore */}
              {((PROVIDER_COMMANDS['gmail'] as any).commands || PROVIDER_COMMANDS['gmail']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['gmail'] || '')} disabled={!selectedCommand['gmail']}>Run</Button>
          </div>
        )}
      </div>
      )}

      {/* Anthropic Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'anthropic') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Anthropic Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newAnthropicToken} onChange={e => setNewAnthropicToken(e.target.value)} placeholder="Anthropic API Key" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('anthropic', newAnthropicToken); setNewAnthropicToken(''); }} disabled={!newAnthropicToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Key</Button>
        </div>
        <div className="mb-2">
          {anthropicAccounts.length > 0 && <div className="text-xs mb-1">API Keys:</div>}
          <ul className="space-y-1">
            {anthropicAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeAnthropicId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{partialToken(acc.credentials?.token)}</span>
                <Button size="sm" onClick={() => handleSetActive('anthropic', acc.id)} disabled={activeAnthropicId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeAnthropicId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['anthropic'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['anthropic'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, anthropic: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore */}
              {((PROVIDER_COMMANDS['anthropic'] as any).commands || PROVIDER_COMMANDS['anthropic']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['anthropic'] || '')} disabled={!selectedCommand['anthropic']}>Run</Button>
          </div>
        )}
      </div>
      )}

      {/* OpenAI Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'openai') && (
      <div>
        <h2 className="text-lg font-bold mb-2">OpenAI Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newOpenAIToken} onChange={e => setNewOpenAIToken(e.target.value)} placeholder="OpenAI API Key" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('openai', newOpenAIToken); setNewOpenAIToken(''); }} disabled={!newOpenAIToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Key</Button>
        </div>
        <div className="mb-2">
          {openaiAccounts.length > 0 && <div className="text-xs mb-1">API Keys:</div>}
          <ul className="space-y-1">
            {openaiAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeOpenAIId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{partialToken(acc.credentials?.token)}</span>
                <Button size="sm" onClick={() => handleSetActive('openai', acc.id)} disabled={activeOpenAIId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeOpenAIId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['openai'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['openai'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, openai: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore */}
              {((PROVIDER_COMMANDS['openai'] as any).commands || PROVIDER_COMMANDS['openai']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['openai'] || '')} disabled={!selectedCommand['openai']}>Run</Button>
          </div>
        )}
      </div>
      )}

      {/* Gemini Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'google') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Gemini Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newGeminiToken} onChange={e => setNewGeminiToken(e.target.value)} placeholder="Gemini API Key" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('google', newGeminiToken); setNewGeminiToken(''); }} disabled={!newGeminiToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Key</Button>
        </div>
        <div className="mb-2">
          {geminiAccounts.length > 0 && <div className="text-xs mb-1">API Keys:</div>}
          <ul className="space-y-1">
            {geminiAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeGeminiId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{partialToken(acc.credentials?.token)}</span>
                <Button size="sm" onClick={() => handleSetActive('google', acc.id)} disabled={activeGeminiId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeGeminiId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['google'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['google'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, google: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore */}
              {((PROVIDER_COMMANDS['google'] as any).commands || PROVIDER_COMMANDS['google']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['google'] || '')} disabled={!selectedCommand['google']}>Run</Button>
          </div>
        )}
      </div>
      )}

      {/* Make.com Custom App */}
      {(!selectedProvider || selectedProvider === 'make_com') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Make.com Custom App</h2>
        <p className={`text-xs mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>Download the MCP Make.com app JSON and import it via <b>Create a tool → Import JSON</b> in Make.com.</p>
        <a href={MAKE_APP_JSON_URL} download className="text-blue-400 underline text-sm">Download Make.com App JSON</a>
        <div className="mt-3 space-y-2">
          <input type="text" placeholder="Base URL (e.g. https://api.my-mcp.com)" value={makeBaseUrl} onChange={e => setMakeBaseUrl(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <input type="password" placeholder="API Key (optional)" value={makeApiKey} onChange={e => setMakeApiKey(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={handleSaveMakeCreds} className={darkMode ? 'bg-blue-700 text-white' : ''}>Save Credentials Locally</Button>
        </div>
      </div>
      )}

      {/* n8n Custom Node */}
      {(!selectedProvider || selectedProvider === 'n8n') && (
      <div>
        <h2 className="text-lg font-bold mb-2">n8n Custom Node</h2>
        <p className={`text-xs mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>Install the node in your n8n instance then set Base URL / API Key below.</p>
        <a href={N8N_NPM_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm">View on NPM (install guide)</a>
        <div className="mt-3 space-y-2">
          <input type="text" placeholder="Base URL (e.g. https://api.my-mcp.com)" value={n8nBaseUrl} onChange={e => setN8nBaseUrl(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <input type="password" placeholder="API Key (optional)" value={n8nApiKey} onChange={e => setN8nApiKey(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={handleSaveN8nCreds} className={darkMode ? 'bg-blue-700 text-white' : ''}>Save Credentials Locally</Button>
        </div>
      </div>
      )}

      {/* Zapier Private Integration */}
      {(!selectedProvider || selectedProvider === 'zapier_cli') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Zapier Private App</h2>
        <p className={`text-xs mb-1 ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>Ask Ops for the invite link to the private Zapier app, then install it to your workspace.</p>
        <a href={ZAPIER_INVITE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm">Open Zapier Invite</a>
        {/* Private app credentials */}
        <div className="mt-3 space-y-2">
          <input type="text" placeholder="Base URL (e.g. https://api.my-mcp.com)" value={zapierBaseUrl} onChange={e => setZapierBaseUrl(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <input type="password" placeholder="API Key" value={zapierPrivKey} onChange={e => setZapierPrivKey(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm w-full ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={handleSaveZapierPrivCreds} className={darkMode ? 'bg-blue-700 text-white' : ''}>Save Credentials Locally</Button>
        </div>
      </div>
      )}

      {/* Slack Multi-Account Management */}
      {(!selectedProvider || selectedProvider === 'slack') && (
      <div>
        <h2 className="text-lg font-bold mb-2">Slack Integration</h2>
        <div className="mb-2 flex space-x-2">
          <input type="password" value={newSlackToken} onChange={handleSlackTokenChange} placeholder="Slack Token (xapp-1-...)" className={`border rounded-lg px-2 py-1 text-sm flex-1 ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : 'border-gray-300'}`} />
          <Button onClick={() => { handleAddAccount('slack', newSlackToken); setNewSlackToken(''); }} disabled={!newSlackToken} className={darkMode ? 'bg-blue-700 text-white' : ''}>Add Account</Button>
        </div>
        <div className="mb-2">
          {slackAccounts.length > 0 && <div className="text-xs mb-1">Accounts:</div>}
          <ul className="space-y-1">
            {slackAccounts.map(acc => (
              <li key={acc.id} className={`flex items-center space-x-2 p-2 rounded ${activeSlackId === acc.id ? 'bg-blue-900/30 border border-blue-500' : ''}`}>
                <span className="font-mono text-xs">{acc.account_label} ({partialToken(acc.credentials?.token)})</span>
                <Button size="sm" onClick={() => handleSetActive('slack', acc.id)} disabled={activeSlackId === acc.id} className={darkMode ? 'bg-blue-700 text-white' : ''}>{activeSlackId === acc.id ? 'Active' : 'Set Active'}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={handleSlackList} disabled={!activeSlackToken || slackLoading} className={darkMode ? 'bg-blue-700 text-white' : ''}>{slackLoading ? 'Listing...' : 'List My Channels'}</Button>
        {slackResult && <div className="mt-2 text-sm text-red-600">{slackResult}</div>}
        {slackChannels.length > 0 && (
          <div className="mt-2 text-sm text-gray-700">
            <b>Your Channels:</b>
            <ul className="list-disc ml-5 mt-1">
              {slackChannels.map((channel: any) => (
                <li key={channel.id}>{channel.name}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Command Dropdown */}
        {PROVIDER_COMMANDS['slack'] && (
          <div className="mb-2 flex items-center space-x-2">
            <select
              value={selectedCommand['slack'] || ''}
              onChange={e => {
                setSelectedCommand(cmds => ({ ...cmds, slack: e.target.value }));
                setInput(e.target.value);
              }}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Select a command...</option>
              {/* @ts-ignore */}
              {((PROVIDER_COMMANDS['slack'] as any).commands || PROVIDER_COMMANDS['slack']).map((cmd: any) => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['slack'] || '')} disabled={!selectedCommand['slack']}>Run</Button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}; 