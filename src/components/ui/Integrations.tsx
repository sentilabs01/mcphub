import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { fetchUserRepos } from '../../services/githubService';
import { listDriveFiles, listGmailMessages } from '../../services/googleService';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserIntegrationAccounts,
  addUserIntegrationAccount,
  updateUserIntegrationAccount,
  deleteUserIntegrationAccount,
} from '../../services/userIntegrationAccountsService';
import { PROVIDER_COMMANDS } from '../../utils/providerCommands';
import { useChatBarInput } from '../../context/ChatBarInputContext';

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
  // State for active account IDs
  const [activeGithubId, setActiveGithubId] = useState<string | null>(null);
  const [activeDriveId, setActiveDriveId] = useState<string | null>(null);
  const [activeGmailId, setActiveGmailId] = useState<string | null>(null);
  const [activeAnthropicId, setActiveAnthropicId] = useState<string | null>(null);
  const [activeOpenAIId, setActiveOpenAIId] = useState<string | null>(null);
  const [activeGeminiId, setActiveGeminiId] = useState<string | null>(null);
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
  };

  // Set active account handler
  const handleSetActive = (provider: string, id: string) => {
    let token = '';
    console.log('Setting active account:', { provider, id });
    if (provider === 'github') {
      setActiveGithubId(id);
      localStorage.setItem('activeGithubId', id);
      token = accounts.find(a => a.provider === 'github' && a.id === id)?.credentials?.token || '';
      console.log('Saving githubToken:', token);
      localStorage.setItem('githubToken', token);
    } else if (provider === 'google_drive') {
      setActiveDriveId(id);
      localStorage.setItem('activeDriveId', id);
      token = accounts.find(a => a.provider === 'google_drive' && a.id === id)?.credentials?.token || '';
      console.log('Saving googleToken:', token);
      localStorage.setItem('googleToken', token);
    } else if (provider === 'gmail') {
      setActiveGmailId(id);
      localStorage.setItem('activeGmailId', id);
      token = accounts.find(a => a.provider === 'gmail' && a.id === id)?.credentials?.token || '';
      console.log('Saving gmailToken:', token);
      localStorage.setItem('gmailToken', token);
    } else if (provider === 'anthropic') {
      setActiveAnthropicId(id);
      localStorage.setItem('activeAnthropicId', id);
      token = accounts.find(a => a.provider === 'anthropic' && a.id === id)?.credentials?.token || '';
      console.log('Saving anthropic_token:', token);
      localStorage.setItem('anthropic_token', token);
    } else if (provider === 'openai') {
      setActiveOpenAIId(id);
      localStorage.setItem('activeOpenAIId', id);
      token = accounts.find(a => a.provider === 'openai' && a.id === id)?.credentials?.token || '';
      console.log('Saving openai_token:', token);
      localStorage.setItem('openai_token', token);
    } else if (provider === 'google') {
      setActiveGeminiId(id);
      localStorage.setItem('activeGeminiId', id);
      token = accounts.find(a => a.provider === 'google' && a.id === id)?.credentials?.token || '';
      console.log('Saving google_token:', token);
      localStorage.setItem('google_token', token);
    }
  };

  // Filter accounts by provider
  const githubAccounts = accounts.filter(a => a.provider === 'github');
  const driveAccounts = accounts.filter(a => a.provider === 'google_drive');
  const gmailAccounts = accounts.filter(a => a.provider === 'gmail');
  const anthropicAccounts = accounts.filter(a => a.provider === 'anthropic');
  const openaiAccounts = accounts.filter(a => a.provider === 'openai');
  const geminiAccounts = accounts.filter(a => a.provider === 'google');

  // Get active tokens
  const activeGithubToken = githubAccounts.find(a => a.id === activeGithubId)?.credentials?.token || '';
  const activeDriveToken = driveAccounts.find(a => a.id === activeDriveId)?.credentials?.token || '';
  const activeGmailToken = gmailAccounts.find(a => a.id === activeGmailId)?.credentials?.token || '';
  const activeAnthropicToken = anthropicAccounts.find(a => a.id === activeAnthropicId)?.credentials?.token || '';
  const activeOpenAIToken = openaiAccounts.find(a => a.id === activeOpenAIId)?.credentials?.token || '';
  const activeGeminiToken = geminiAccounts.find(a => a.id === activeGeminiId)?.credentials?.token || '';

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
    setZapierResult('Triggered Zapier webhook (demo).');
    // TODO: Call Zapier webhook with sample data
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
                <Button size="sm" variant="danger" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
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
              {PROVIDER_COMMANDS['github'].map(cmd => (
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
                <Button size="sm" variant="danger" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
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
              {PROVIDER_COMMANDS['google_drive'].map(cmd => (
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
                <Button size="sm" variant="danger" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
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
              {PROVIDER_COMMANDS['gmail'].map(cmd => (
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
                <Button size="sm" variant="danger" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
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
              {PROVIDER_COMMANDS['anthropic'].map(cmd => (
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
                <Button size="sm" variant="danger" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
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
              {PROVIDER_COMMANDS['openai'].map(cmd => (
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
                <Button size="sm" variant="danger" onClick={() => handleRemoveAccount(acc.id)}>Remove</Button>
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
              {PROVIDER_COMMANDS['google'].map(cmd => (
                <option key={cmd.value} value={cmd.value}>{cmd.label}</option>
              ))}
            </select>
            <Button onClick={() => setInput(selectedCommand['google'] || '')} disabled={!selectedCommand['google']}>Run</Button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}; 