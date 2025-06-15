import React, { useEffect, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { ProviderMeta } from '../../data/providers';
import { MCPServer } from '../../types';
import { MCPServerService } from '../../services/mcpServerService';
import { fetchMCPCommands, runMCPCommand } from '../../services/mcpApiService';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { verifyGithubToken } from '../../services/githubService';
import { getCredential, saveCredential, deleteCredential } from '../../services/credentialsService';
import { validateZapierApiKey } from '../../services/zapierService';
import { validateOpenAIApiKey } from '../../services/openaiService';
import { prettyPrintResult } from '../../utils/prettyPrint';

interface ProviderPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderMeta | null;
  darkMode?: boolean;
}

export const ProviderPortalModal: React.FC<ProviderPortalModalProps> = ({ isOpen, onClose, provider, darkMode }) => {
  const [server, setServer] = useState<MCPServer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCommands, setLiveCommands] = useState<string[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(false);
  const [commandsError, setCommandsError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [commandRunning, setCommandRunning] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  // State for OpenAI API key input
  const [openAIApiKey, setOpenAIApiKey] = useState('');
  const [openAIApiKeySaved, setOpenAIApiKeySaved] = useState(false);
  // New: Feedback state for OpenAI key actions
  const [openAIFeedback, setOpenAIFeedback] = useState<string | null>(null);
  const [openAITesting, setOpenAITesting] = useState(false);
  // State for Google Drive and Gmail
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  // State for GitHub token
  const [githubToken, setGithubToken] = useState('');
  const [githubTokenSaved, setGithubTokenSaved] = useState(false);
  // Add state for GitHub feedback and testing
  const [githubFeedback, setGithubFeedback] = useState<string | null>(null);
  const [githubTesting, setGithubTesting] = useState(false);
  // Add state for feedback and testing for all key/token providers
  const [anthropicFeedback, setAnthropicFeedback] = useState<string | null>(null);
  const [anthropicTesting, setAnthropicTesting] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<string | null>(null);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const { user, session } = useAuth();

  // Remove local drive/gmail state, use Supabase session
  const googleAccessToken = session?.provider_token || '';
  const userEmail = user?.email || '';

  if (!user) {
    return isOpen ? (
      <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40" onClick={onClose}>
        <div className={`bg-${darkMode ? 'zinc-900' : 'white'} rounded-lg p-6 w-[320px] text-center`} onClick={e => e.stopPropagation()}>
          <h2 className="text-lg font-semibold mb-2">Please sign in</h2>
          <p className="text-sm mb-4">Login to manage {provider?.name || 'this integration'}.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    ) : null;
  }

  useEffect(() => {
    if (isOpen && provider) {
      setLoading(true);
      setError(null);
      MCPServerService.getServerById(provider.mcpServerId)
        .then(setServer)
        .catch(() => setError('Failed to load MCP server info'))
        .finally(() => setLoading(false));
    } else {
      setServer(null);
    }
  }, [isOpen, provider]);

  // Fetch live commands for OpenAI and Anthropic
  useEffect(() => {
    if (
      isOpen &&
      provider &&
      (provider.id === 'anthropic' || provider.id === 'openai') &&
      server &&
      server.apiUrl
    ) {
      setCommandsLoading(true);
      setCommandsError(null);
      // Use the correct token for the provider
      let userToken = 'demo-user-token';
      if (provider && provider.id === 'openai') {
        userToken = localStorage.getItem('openai_token') || '';
      } else if (provider && provider.id === 'anthropic') {
        userToken = localStorage.getItem('anthropic_token') || '';
      }
      fetchMCPCommands(server.apiUrl, userToken)
        .then((cmds) => setLiveCommands(Array.isArray(cmds) ? cmds : []))
        .catch(() => setCommandsError('Failed to fetch live commands'))
        .finally(() => setCommandsLoading(false));
    } else {
      setLiveCommands([]);
    }
  }, [isOpen, provider, server]);

  // Reset command state when modal closes or provider changes
  useEffect(() => {
    setCommandInput('');
    setCommandResult(null);
    setCommandRunning(false);
    setCommandError(null);
  }, [isOpen, provider]);

  useEffect(() => {
    if (isOpen && provider && provider.id === 'github') {
      const stored = localStorage.getItem('github_token') || '';
      setGithubToken(stored);
      setGithubTokenSaved(!!stored);
    }
    if (isOpen && provider && provider.id === 'openai') {
      const stored = localStorage.getItem('openai_token') || '';
      setOpenAIApiKey(stored);
      setOpenAIApiKeySaved(!!stored);
    }
  }, [isOpen, provider]);

  // Check connection status on open
  useEffect(() => {
    const authenticated = !!user;
    if (provider?.id === 'google_drive') {
      if (authenticated) {
        const token = localStorage.getItem('googleToken');
        setDriveConnected(!!token);
      } else {
        setDriveConnected(false);
      }
      if (!authenticated) setDriveEmail('');
    }
    if (provider?.id === 'gmail') {
      if (authenticated) {
        const token = localStorage.getItem('gmailToken');
        setGmailConnected(!!token);
      } else {
        setGmailConnected(false);
      }
      if (!authenticated) setGmailEmail('');
    }
  }, [provider, isOpen, user]);

  const handleRunCommand = async () => {
    if (!server || !server.apiUrl || !commandInput.trim() || !provider) return;
    setCommandRunning(true);
    setCommandResult(null);
    setCommandError(null);
    // Use the correct token for the provider
    let userToken = 'demo-user-token';
    if (provider && provider.id === 'openai') {
      userToken = localStorage.getItem('openai_token') || '';
    } else if (provider && provider.id === 'anthropic') {
      userToken = localStorage.getItem('anthropic_token') || '';
    }
    try {
      const result = await runMCPCommand(server.apiUrl, userToken, commandInput.trim(), {}, provider.id);
      setCommandResult(prettyPrintResult(provider.id, result));
    } catch (err: any) {
      setCommandError(err.message || 'Failed to run command');
    } finally {
      setCommandRunning(false);
    }
  };

  const handleSaveOpenAIApiKey = () => {
    localStorage.setItem('openai_token', openAIApiKey);
    setOpenAIApiKeySaved(true);
    setOpenAIFeedback('API key saved successfully!');
    // Reload from localStorage to ensure sync
    const stored = localStorage.getItem('openai_token') || '';
    setOpenAIApiKey(stored);
    setTimeout(() => setOpenAIFeedback(null), 2000);
  };

  const handleRemoveOpenAIApiKey = () => {
    localStorage.removeItem('openai_token');
    setOpenAIApiKey('');
    setOpenAIApiKeySaved(false);
    setOpenAIFeedback('API key removed.');
    setTimeout(() => setOpenAIFeedback(null), 2000);
  };

  // New: Test OpenAI Key
  const handleTestOpenAIApiKey = async () => {
    setOpenAITesting(true);
    setOpenAIFeedback(null);
    try {
      const status = await validateOpenAIApiKey(openAIApiKey);
      if (status === 'valid') {
        setOpenAIFeedback('API key is valid ✅');
      } else if (status === 'quota_exceeded') {
        setOpenAIFeedback('Key is valid but your OpenAI quota is exhausted. Check billing.');
      } else if (status === 'invalid') {
        setOpenAIFeedback('OpenAI rejected this key.');
      } else {
        setOpenAIFeedback('Unable to verify key (network or unknown error).');
      }
    } catch (err: any) {
      setOpenAIFeedback('API key test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setOpenAITesting(false);
      setTimeout(() => setOpenAIFeedback(null), 4000);
    }
  };

  const handleGmailLoginSuccess = (cred: any) => {
    localStorage.setItem('gmailToken', cred.credential);
    try {
      const decoded: any = jwtDecode(cred.credential);
      setGmailEmail(decoded.email || '');
    } catch {
      setGmailEmail('');
    }
    setGmailConnected(true);
  };
  const handleDisconnectGmail = () => {
    localStorage.removeItem('gmailToken');
    setGmailConnected(false);
    setGmailEmail('');
  };

  const handleSaveGithubToken = async () => {
    if (!user) return;
    const ok = await saveCredential(user.id, 'github', { token: githubToken });
    if (ok) {
      setGithubTokenSaved(true);
      setGithubFeedback('Token saved successfully!');
    } else {
      setGithubFeedback('Failed to save token');
    }
    setTimeout(() => setGithubFeedback(null), 2000);
  };

  const handleRemoveGithubToken = async () => {
    if (!user) return;
    await deleteCredential(user.id, 'github');
    setGithubToken('');
    setGithubTokenSaved(false);
    setGithubFeedback('Token removed.');
    setTimeout(() => setGithubFeedback(null), 2000);
  };

  const handleTestGithubToken = async () => {
    setGithubTesting(true);
    setGithubFeedback(null);
    try {
      const user = await verifyGithubToken(githubToken);
      if (user && user.login) {
        setGithubFeedback(`Token is valid for @${user.login}!`);
      } else {
        setGithubFeedback('Token verification returned no user data.');
      }
    } catch (err: any) {
      setGithubFeedback('Token test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGithubTesting(false);
      setTimeout(() => setGithubFeedback(null), 4000);
    }
  };

  if (!isOpen || !provider) return null;

  return (
    <div
      className={`fixed inset-0 ${darkMode ? 'bg-black bg-opacity-80' : 'bg-black bg-opacity-50'} backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <Card
        className={`w-full max-w-lg relative animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-[#18181b] border-zinc-700 text-white' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <img src={darkMode && provider.logoDark ? provider.logoDark : provider.logo} alt={provider.name} className="w-16 h-16 rounded-xl mb-2" />
            <h2 className="text-xl font-bold mb-1">{provider.name} Portal</h2>
            {loading && <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Loading MCP server info...</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
            {server && (
              <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>MCP Server: {server.name} ({server.version})</span>
            )}
          </div>

          {/* Commands */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Available Commands</h3>
            {(provider.id === 'anthropic' || provider.id === 'openai') && server && server.apiUrl ? (
              commandsLoading ? (
                <div className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Loading live commands...</div>
              ) : commandsError ? (
                <div className="text-xs text-red-500">{commandsError}</div>
              ) : (
                <ul className={`list-disc list-inside text-sm ${darkMode ? 'text-zinc-200' : 'text-gray-700'} space-y-1`}>
                  {liveCommands.length > 0 ? (
                    liveCommands.map((cmd: any, i: number) => (
                      <li key={i}>/{provider.id} {typeof cmd === 'string' ? cmd : cmd.name || JSON.stringify(cmd)}</li>
                    ))
                  ) : (
                    <li>No live commands found.</li>
                  )}
                </ul>
              )
            ) : (
              <ul className={`list-disc list-inside text-sm ${darkMode ? 'text-zinc-200' : 'text-gray-700'} space-y-1`}>
                {provider.commands.map((cmd, i) => (
                  <li key={i}>/{provider.id} {cmd}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Account Management Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Accounts</h3>
            {provider.id === 'openai' ? (
              <OpenAIKeyManager darkMode={darkMode} />
            ) : provider.id === 'anthropic' ? (
              <AnthropicKeyManager darkMode={darkMode} feedback={anthropicFeedback} setFeedback={setAnthropicFeedback} testing={anthropicTesting} setTesting={setAnthropicTesting} />
            ) : provider.id === 'gemini' ? (
              <GeminiKeyManager darkMode={darkMode} feedback={geminiFeedback} setFeedback={setGeminiFeedback} testing={geminiTesting} setTesting={setGeminiTesting} />
            ) : provider.id === 'google_drive' ? (
              googleAccessToken ? (
                <span className="text-xs text-green-500">Connected as {userEmail || 'Google user'} via Supabase login</span>
              ) : (
                <span className="text-xs text-yellow-500">Not connected. Sign in first.</span>
              )
            ) : provider.id === 'gmail' ? (
              googleAccessToken ? (
                <span className="text-xs text-green-500">Connected as {userEmail || 'Gmail user'} via Supabase login</span>
              ) : (
                <span className="text-xs text-yellow-500">Not connected. Sign in first.</span>
              )
            ) : provider.id === 'zapier' || provider.id === 'zapier_cli' ? (
              <ZapierKeyManager darkMode={darkMode} />
            ) : provider.id === 'n8n' ? (
              <N8nKeyManager darkMode={darkMode} />
            ) : provider.id === 'make_com' ? (
              <MakeKeyManager darkMode={darkMode} />
            ) : (
              <div className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Account management UI coming soon.</div>
            )}
            {provider.id === 'github' ? (
              <GithubKeyManager
                darkMode={darkMode}
                feedback={githubFeedback}
                setFeedback={setGithubFeedback}
                testing={githubTesting}
                setTesting={setGithubTesting}
              />
            ) : null}
          </div>

          {/* Status/Error Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Status</h3>
            {provider.id === 'openai' ? (
              <div className={`text-xs mt-1 ${openAIFeedback ? (openAIFeedback.includes('valid') ? 'text-green-600' : 'text-red-500') : (darkMode ? 'text-zinc-400' : 'text-gray-400')}`}>{openAIFeedback || 'No recent status.'}</div>
            ) : provider.id === 'anthropic' ? (
              <div className={`text-xs mt-1 ${anthropicFeedback ? (anthropicFeedback.includes('valid') ? 'text-green-600' : 'text-red-500') : (darkMode ? 'text-zinc-400' : 'text-gray-400')}`}>{anthropicFeedback || 'No recent status.'}</div>
            ) : provider.id === 'gemini' ? (
              <div className={`text-xs mt-1 ${geminiFeedback ? (geminiFeedback.includes('valid') ? 'text-green-600' : 'text-red-500') : (darkMode ? 'text-zinc-400' : 'text-gray-400')}`}>{geminiFeedback || 'No recent status.'}</div>
            ) : provider.id === 'github' ? (
              <div className={`text-xs mt-1 ${githubFeedback ? (githubFeedback.includes('valid') ? 'text-green-600' : 'text-red-500') : (darkMode ? 'text-zinc-400' : 'text-gray-400')}`}>{githubFeedback || 'No recent status.'}</div>
            ) : provider.id === 'n8n' ? (
              <div className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Credentials stored locally.</div>
            ) : provider.id === 'make_com' ? (
              <div className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Credentials stored locally.</div>
            ) : provider.id === 'zapier' || provider.id === 'zapier_cli' ? (
              <div className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Credentials stored locally.</div>
            ) : (
              <div className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>No recent status.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AnthropicKeyManager: React.FC<{ darkMode?: boolean, feedback: string | null, setFeedback: (msg: string | null) => void, testing: boolean, setTesting: (b: boolean) => void }> = ({ darkMode, feedback, setFeedback, testing, setTesting }) => {
  const [anthropicKey, setAnthropicKey] = React.useState('');
  const [anthropicKeySaved, setAnthropicKeySaved] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem('anthropic_token') || '';
    setAnthropicKey(stored);
    setAnthropicKeySaved(!!stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('anthropic_token', anthropicKey);
    setAnthropicKeySaved(true);
    setFeedback('API key saved successfully!');
    setAnthropicKey(localStorage.getItem('anthropic_token') || '');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleRemove = () => {
    localStorage.removeItem('anthropic_token');
    setAnthropicKey('');
    setAnthropicKeySaved(false);
    setFeedback('API key removed.');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const { MCPServerService } = await import('../../services/mcpServerService');
      const { runMCPCommand } = await import('../../services/mcpApiService');
      const server = await MCPServerService.getServerById('anthropic');
      if (!server || !server.apiUrl) {
        setFeedback('Anthropic MCP server not found.');
        setTesting(false);
        return;
      }
      const result = await runMCPCommand(server.apiUrl, anthropicKey, 'Say hello!', {}, 'anthropic');
      // Accept output or reply as valid
      if (result && (result.reply || result.output)) {
        setFeedback('API key is valid!');
      } else {
        setFeedback('API key test failed: No reply from server.');
      }
    } catch (err: any) {
      setFeedback('API key test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTesting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">Anthropic API Key <span className="text-red-500">*</span></label>
      <input
        type="password"
        value={anthropicKey}
        onChange={e => { setAnthropicKey(e.target.value); setAnthropicKeySaved(false); setFeedback(null); }}
        placeholder="sk-ant-..."
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        autoComplete="off"
      />
      <div className="flex items-center space-x-2">
        <Button onClick={handleSave} disabled={!anthropicKey || anthropicKeySaved} size="sm">
          {anthropicKeySaved ? 'Saved' : 'Save'}
        </Button>
        {anthropicKeySaved && (
          <Button onClick={handleRemove} variant="destructive" size="sm">Remove</Button>
        )}
        <Button onClick={handleTest} disabled={!anthropicKey || testing} size="sm" variant="secondary">
          {testing ? 'Testing...' : 'Test Key'}
        </Button>
      </div>
      {feedback && (
        <div className={`text-xs mt-1 ${feedback.includes('valid') ? 'text-green-600' : 'text-red-500'}`}>{feedback}</div>
      )}
      <span className="text-xs text-gray-500">Required for all Anthropic commands. Your key is stored locally and never shared.</span>
    </div>
  );
};

const GeminiKeyManager: React.FC<{ darkMode?: boolean, feedback: string | null, setFeedback: (msg: string | null) => void, testing: boolean, setTesting: (b: boolean) => void }> = ({ darkMode, feedback, setFeedback, testing, setTesting }) => {
  const [geminiKey, setGeminiKey] = React.useState('');
  const [geminiKeySaved, setGeminiKeySaved] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem('google_token') || '';
    setGeminiKey(stored);
    setGeminiKeySaved(!!stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('google_token', geminiKey);
    setGeminiKeySaved(true);
    setFeedback('API key saved successfully!');
    setGeminiKey(localStorage.getItem('google_token') || '');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleRemove = () => {
    localStorage.removeItem('google_token');
    setGeminiKey('');
    setGeminiKeySaved(false);
    setFeedback('API key removed.');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const { MCPServerService } = await import('../../services/mcpServerService');
      const { runMCPCommand } = await import('../../services/mcpApiService');
      const server = await MCPServerService.getServerById('gemini');
      if (!server || !server.apiUrl) {
        setFeedback('Gemini MCP server not found.');
        setTesting(false);
        return;
      }
      const result = await runMCPCommand(server.apiUrl, geminiKey, 'Say hello!', {}, 'gemini');
      // Accept output or reply as valid
      if (result && (result.reply || result.output)) {
        setFeedback('API key is valid!');
      } else {
        setFeedback('API key test failed: No reply from server.');
      }
    } catch (err: any) {
      setFeedback('API key test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTesting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">Gemini API Key <span className="text-red-500">*</span></label>
      <input
        type="password"
        value={geminiKey}
        onChange={e => { setGeminiKey(e.target.value); setGeminiKeySaved(false); setFeedback(null); }}
        placeholder="AIza..."
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        autoComplete="off"
      />
      <div className="flex items-center space-x-2">
        <Button onClick={handleSave} disabled={!geminiKey || geminiKeySaved} size="sm">
          {geminiKeySaved ? 'Saved' : 'Save'}
        </Button>
        {geminiKeySaved && (
          <Button onClick={handleRemove} variant="destructive" size="sm">Remove</Button>
        )}
        <Button onClick={handleTest} disabled={!geminiKey || testing} size="sm" variant="secondary">
          {testing ? 'Testing...' : 'Test Key'}
        </Button>
      </div>
      {feedback && (
        <div className={`text-xs mt-1 ${feedback.includes('valid') ? 'text-green-600' : 'text-red-500'}`}>{feedback}</div>
      )}
      <span className="text-xs text-gray-500">Required for all Gemini commands. Your key is stored locally and never shared.</span>
    </div>
  );
};

const DriveOAuthManager: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [driveToken, setDriveToken] = React.useState('');
  const [driveEmail, setDriveEmail] = React.useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('googleToken') || '';
    setDriveToken(token);
    if (token) {
      if (token.includes('.')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setDriveEmail(payload.email || '');
        } catch {
          // fallthrough to fetch profile
        }
      }
      if (!driveEmail) {
        // attempt to fetch profile with access token
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(u => setDriveEmail(u?.email || ''))
          .catch(() => setDriveEmail(''));
      }
    } else {
      setDriveEmail('');
    }
  }, []);

  const driveLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit',
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        localStorage.setItem('googleToken', tokenResponse.access_token);
        setDriveToken(tokenResponse.access_token);
        // Optional: fetch userinfo for email
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
          .then(r => r.json())
          .then(u => setDriveEmail(u.email || ''))
          .catch(() => setDriveEmail(''));
      }
    },
    onError: () => alert('Google Drive login failed'),
  });

  const handleDisconnect = () => {
    localStorage.removeItem('googleToken');
    setDriveToken('');
    setDriveEmail('');
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">Google Drive Account</label>
      {driveToken ? (
        <>
          <span className="text-xs text-green-500">Connected{driveEmail && ` as ${driveEmail}`}</span>
          <Button onClick={handleDisconnect} variant="destructive" size="sm">Disconnect</Button>
        </>
      ) : (
        <Button onClick={() => driveLogin()} className={`${darkMode ? 'bg-blue-700 text-white' : ''}`}>Connect Google Drive</Button>
      )}
      <span className="text-xs text-gray-500">Connect any Google account for Drive integration. This is independent of app login.</span>
    </div>
  );
};

const GmailOAuthManager: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [gmailToken, setGmailToken] = React.useState('');
  const [gmailEmail, setGmailEmail] = React.useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('gmailToken') || '';
    setGmailToken(token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setGmailEmail(payload.email || '');
      } catch {
        setGmailEmail('');
      }
    } else {
      setGmailEmail('');
    }
  }, []);

  const handleLoginSuccess = (cred: any) => {
    localStorage.setItem('gmailToken', cred.credential);
    try {
      const payload = JSON.parse(atob(cred.credential.split('.')[1]));
      setGmailEmail(payload.email || '');
    } catch {
      setGmailEmail('');
    }
    setGmailToken(cred.credential);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('gmailToken');
    setGmailToken('');
    setGmailEmail('');
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">Gmail Account</label>
      {gmailToken ? (
        <>
          <span className="text-xs text-green-500">Connected{gmailEmail && ` as ${gmailEmail}`}</span>
          <Button onClick={handleDisconnect} variant="destructive" size="sm">Disconnect</Button>
        </>
      ) : (
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={() => alert('Gmail login failed')}
          useOneTap={false}
          width={240}
        />
      )}
      <span className="text-xs text-gray-500">Connect any Google account for Gmail integration. This is independent of app login.</span>
    </div>
  );
};

const GithubKeyManager: React.FC<{ darkMode?: boolean, feedback: string | null, setFeedback: (msg: string | null) => void, testing: boolean, setTesting: (b: boolean) => void }> = ({ darkMode, feedback, setFeedback, testing, setTesting }) => {
  const [githubToken, setGithubToken] = React.useState('');
  const [githubTokenSaved, setGithubTokenSaved] = React.useState(false);
  const { user } = useAuth();

  // Load from Supabase (and migrate legacy localStorage)
  React.useEffect(() => {
    if (!user) return;

    (async () => {
      // Migration: if old token in localStorage, push to Supabase once
      const legacy = localStorage.getItem('github_token');
      if (legacy) {
        await saveCredential(user.id, 'github', { token: legacy });
        localStorage.removeItem('github_token');
      }

      const rec = await getCredential(user.id, 'github');
      const token = rec?.credentials?.token || '';
      setGithubToken(token);
      setGithubTokenSaved(!!token);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const ok = await saveCredential(user.id, 'github', { token: githubToken });
    if (ok) {
      setGithubTokenSaved(true);
      setFeedback('Token saved successfully!');
    } else {
      setFeedback('Failed to save token');
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleRemove = async () => {
    if (!user) return;
    await deleteCredential(user.id, 'github');
    setGithubToken('');
    setGithubTokenSaved(false);
    setFeedback('Token removed.');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const user = await verifyGithubToken(githubToken);
      if (user && user.login) {
        setFeedback(`Token is valid for @${user.login}!`);
      } else {
        setFeedback('Token verification returned no user data.');
      }
    } catch (err: any) {
      setFeedback('Token test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTesting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">GitHub Personal Access Token <span className="text-red-500">*</span></label>
      <input
        type="password"
        value={githubToken}
        onChange={e => { setGithubToken(e.target.value); setGithubTokenSaved(false); setFeedback(null); }}
        placeholder="ghp_..."
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        autoComplete="off"
      />
      <div className="flex items-center space-x-2">
        <Button onClick={handleSave} disabled={!githubToken || githubTokenSaved} size="sm">
          {githubTokenSaved ? 'Saved' : 'Save'}
        </Button>
        {githubTokenSaved && (
          <Button onClick={handleRemove} variant="destructive" size="sm">Remove</Button>
        )}
        <Button onClick={handleTest} disabled={!githubToken || testing} size="sm" variant="secondary">
          {testing ? 'Testing...' : 'Test Token'}
        </Button>
      </div>
      {feedback && (
        <div className={`text-xs mt-1 ${feedback.includes('valid') ? 'text-green-600' : 'text-red-500'}`}>{feedback}</div>
      )}
      <span className="text-xs text-gray-500">Required for all GitHub commands. Your token is stored locally and never shared.</span>
    </div>
  );
};

const ZapierKeyManager: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [apiKey, setApiKey] = React.useState('');
  const [apiKeySaved, setApiKeySaved] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [baseUrl, setBaseUrl] = React.useState('');
  const [privKey, setPrivKey] = React.useState('');
  const [privSaved, setPrivSaved] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;
    getCredential(user.id, 'zapier').then(rec => {
      if (rec) {
        setApiKey(rec.credentials.apiKey || '');
        setApiKeySaved(true);
      }
    });
    getCredential(user.id, 'zapier_cli').then(rec => {
      if (rec) {
        setBaseUrl(rec.credentials.baseUrl || '');
        setPrivKey(rec.credentials.apiKey || '');
        setPrivSaved(true);
      }
    });
  }, [user]);

  const saveApiKey = async () => {
    if (!user) return;
    await saveCredential(user.id, 'zapier', { apiKey });
    setApiKeySaved(true);
    setFeedback('Key saved!');
  };

  const removeApiKey = async () => {
    if (!user) return;
    await deleteCredential(user.id, 'zapier');
    setApiKey('');
    setApiKeySaved(false);
    setFeedback('Key removed');
  };

  const savePriv = async () => {
    if (!user) return;
    await saveCredential(user.id, 'zapier_cli', { baseUrl, apiKey: privKey });
    setPrivSaved(true);
    setFeedback('Private app creds saved!');
  };

  const removePriv = async () => {
    if (!user) return;
    await deleteCredential(user.id, 'zapier_cli');
    setBaseUrl('');
    setPrivKey('');
    setPrivSaved(false);
    setFeedback('Private app creds removed');
  };

  // Call Zapier validation endpoint
  const testApiKey = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const ok = await validateZapierApiKey(apiKey);
      setFeedback(ok ? 'API key is valid ✅' : 'API key appears invalid');
    } catch (err: any) {
      setFeedback(err.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* AI Actions Key */}
      <div className="flex flex-col space-y-2">
        <label className="text-xs font-medium">Zapier AI Actions API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); setApiKeySaved(false); }}
          placeholder="zapier_nla_key..."
          className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        />
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={saveApiKey} disabled={!apiKey || apiKeySaved}>Save</Button>
          {apiKeySaved && (
            <>
              <Button size="sm" variant="secondary" onClick={testApiKey} disabled={testing}>{testing ? 'Testing…' : 'Test'}</Button>
              <Button size="sm" variant="destructive" onClick={removeApiKey}>Remove</Button>
            </>
          )}
        </div>
        {feedback && <div className={`text-xs mt-1 ${feedback.includes('valid') ? 'text-green-600' : 'text-red-500'}`}>{feedback}</div>}
        <span className="text-xs text-gray-500">Stored securely in Supabase – available on every login.</span>
      </div>
      {/* Private App creds */}
      <div className="flex flex-col space-y-2">
        <label className="text-xs font-medium">Private App Base URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={e => { setBaseUrl(e.target.value); setPrivSaved(false); setFeedback(null); }}
          placeholder="https://api.my-mcp.com"
          className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        />
        <label className="text-xs font-medium">Private App API Key (optional)</label>
        <input
          type="password"
          value={privKey}
          onChange={e => { setPrivKey(e.target.value); setPrivSaved(false); setFeedback(null); }}
          placeholder="key..."
          className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        />
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={savePriv} disabled={!baseUrl || privSaved}>Save</Button>
          {privSaved && <Button size="sm" variant="destructive" onClick={removePriv}>Remove</Button>}
        </div>
        <span className="text-xs text-gray-500">Used by the private Zapier connector. Stored securely in Supabase.</span>
      </div>
    </div>
  );
};

const N8nKeyManager: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;
    getCredential(user.id, 'n8n').then(rec => {
      if (rec) {
        setBaseUrl(rec.credentials.baseUrl || '');
        setApiKey(rec.credentials.apiKey || '');
        setSaved(true);
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    await saveCredential(user.id, 'n8n', { baseUrl, apiKey });
    setSaved(true);
  };
  const remove = async () => {
    if (!user) return;
    await deleteCredential(user.id, 'n8n');
    setBaseUrl('');
    setApiKey('');
    setSaved(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">Base URL</label>
      <input
        type="text"
        value={baseUrl}
        onChange={e => { setBaseUrl(e.target.value); setSaved(false); }}
        placeholder="https://api.my-mcp.com"
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
      />
      <label className="text-xs font-medium">API Key (optional)</label>
      <input
        type="password"
        value={apiKey}
        onChange={e => { setApiKey(e.target.value); setSaved(false); }}
        placeholder="key..."
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
      />
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={save} disabled={saved}>Save</Button>
        {saved && <Button size="sm" variant="destructive" onClick={remove}>Remove</Button>}
      </div>
      <span className="text-xs text-gray-500">Only stored in this browser. Used by n8n custom node.</span>
    </div>
  );
};

const MakeKeyManager: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;
    getCredential(user.id, 'make_com').then(rec => {
      if (rec) {
        setBaseUrl(rec.credentials.baseUrl || '');
        setApiKey(rec.credentials.apiKey || '');
        setSaved(true);
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    await saveCredential(user.id, 'make_com', { baseUrl, apiKey });
    setSaved(true);
  };
  const remove = async () => {
    if (!user) return;
    await deleteCredential(user.id, 'make_com');
    setBaseUrl('');
    setApiKey('');
    setSaved(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">Base URL</label>
      <input
        type="text"
        value={baseUrl}
        onChange={e => { setBaseUrl(e.target.value); setSaved(false); }}
        placeholder="https://api.my-mcp.com"
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
      />
      <label className="text-xs font-medium">API Key (optional)</label>
      <input
        type="password"
        value={apiKey}
        onChange={e => { setApiKey(e.target.value); setSaved(false); }}
        placeholder="key..."
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
      />
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={save} disabled={saved}>Save</Button>
        {saved && <Button size="sm" variant="destructive" onClick={remove}>Remove</Button>}
      </div>
      <span className="text-xs text-gray-500">Stored only in this browser. Used by Make.com custom app.</span>
    </div>
  );
};

const OpenAIKeyManager: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [openAIApiKey, setOpenAIApiKey] = React.useState('');
  const [openAIApiKeySaved, setOpenAIApiKeySaved] = React.useState(false);
  const [openAIFeedback, setOpenAIFeedback] = React.useState<string | null>(null);
  const [openAITesting, setOpenAITesting] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem('openai_token') || '';
    setOpenAIApiKey(stored);
    setOpenAIApiKeySaved(!!stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('openai_token', openAIApiKey);
    setOpenAIApiKeySaved(true);
    setOpenAIFeedback('API key saved successfully!');
    setOpenAIApiKey(localStorage.getItem('openai_token') || '');
    setTimeout(() => setOpenAIFeedback(null), 2000);
  };

  const handleRemove = () => {
    localStorage.removeItem('openai_token');
    setOpenAIApiKey('');
    setOpenAIApiKeySaved(false);
    setOpenAIFeedback('API key removed.');
    setTimeout(() => setOpenAIFeedback(null), 2000);
  };

  const handleTest = async () => {
    setOpenAITesting(true);
    setOpenAIFeedback(null);
    try {
      const status = await validateOpenAIApiKey(openAIApiKey);
      if (status === 'valid') {
        setOpenAIFeedback('API key is valid ✅');
      } else if (status === 'quota_exceeded') {
        setOpenAIFeedback('Key is valid but your OpenAI quota is exhausted. Check billing.');
      } else if (status === 'invalid') {
        setOpenAIFeedback('OpenAI rejected this key.');
      } else {
        setOpenAIFeedback('Unable to verify key (network or unknown error).');
      }
    } catch (err: any) {
      setOpenAIFeedback('API key test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setOpenAITesting(false);
      setTimeout(() => setOpenAIFeedback(null), 4000);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-xs font-medium">OpenAI API Key <span className="text-red-500">*</span></label>
      <input
        type="password"
        value={openAIApiKey}
        onChange={e => { setOpenAIApiKey(e.target.value); setOpenAIApiKeySaved(false); setOpenAIFeedback(null); }}
        placeholder="sk-..."
        className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
        autoComplete="off"
      />
      <div className="flex items-center space-x-2">
        <Button onClick={handleSave} disabled={!openAIApiKey || openAIApiKeySaved} size="sm">
          {openAIApiKeySaved ? 'Saved' : 'Save'}
        </Button>
        {openAIApiKeySaved && (
          <Button onClick={handleRemove} variant="destructive" size="sm">Remove</Button>
        )}
        <Button onClick={handleTest} disabled={!openAIApiKey || openAITesting} size="sm" variant="secondary">
          {openAITesting ? 'Testing...' : 'Test Key'}
        </Button>
      </div>
      {openAIFeedback && (
        <div className={`text-xs mt-1 ${openAIFeedback.includes('valid') ? 'text-green-600' : 'text-red-500'}`}>{openAIFeedback}</div>
      )}
      <span className="text-xs text-gray-500">Required for all OpenAI commands. Your key is stored locally and never shared.</span>
    </div>
  );
}; 