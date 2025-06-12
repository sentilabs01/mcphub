import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { ProviderMeta } from '../../data/providers';
import { MCPServer } from '../../types';
import { MCPServerService } from '../../services/mcpServerService';
import { fetchMCPCommands, runMCPCommand } from '../../services/mcpApiService';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

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
      const stored = localStorage.getItem('githubToken') || '';
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
    if (provider?.id === 'google_drive') {
      const token = localStorage.getItem('googleToken');
      if (token) {
        setDriveConnected(true);
        // Optionally fetch and set driveEmail here
      } else {
        setDriveConnected(false);
        setDriveEmail('');
      }
    }
    if (provider?.id === 'gmail') {
      const token = localStorage.getItem('gmailToken');
      if (token) {
        setGmailConnected(true);
        // Optionally fetch and set gmailEmail here
      } else {
        setGmailConnected(false);
        setGmailEmail('');
      }
    }
  }, [provider, isOpen]);

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
      const result = await runMCPCommand(server.apiUrl, userToken, commandInput.trim(), {}, provider);
      setCommandResult(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
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
      // Find the OpenAI MCP server
      const server = await MCPServerService.getServerById('openai');
      console.log('Fetched server:', server); // DEBUG LOG
      if (!server || !server.apiUrl) {
        setOpenAIFeedback('OpenAI MCP server not found.');
        setOpenAITesting(false);
        return;
      }
      // Use a simple prompt for testing
      const result = await runMCPCommand(server.apiUrl, openAIApiKey, 'Say hello!', {}, 'openai');
      if (result && (result.reply || result.output)) {
        setOpenAIFeedback('API key is valid!');
      } else {
        setOpenAIFeedback('API key test failed: No reply from server.');
      }
    } catch (err: any) {
      setOpenAIFeedback('API key test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setOpenAITesting(false);
      setTimeout(() => setOpenAIFeedback(null), 4000);
    }
  };

  // Dummy OAuth handlers (replace with your real OAuth logic)
  const handleGoogleDriveLoginSuccess = (cred: any) => {
    localStorage.setItem('googleToken', cred.credential);
    try {
      const decoded: any = jwtDecode(cred.credential);
      setDriveEmail(decoded.email || '');
    } catch {
      setDriveEmail('');
    }
    setDriveConnected(true);
  };
  const handleDisconnectDrive = () => {
    localStorage.removeItem('googleToken');
    setDriveConnected(false);
    setDriveEmail('');
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

  const handleSaveGithubToken = () => {
    localStorage.setItem('githubToken', githubToken);
    setGithubTokenSaved(true);
    setGithubFeedback('Token saved successfully!');
    const stored = localStorage.getItem('githubToken') || '';
    setGithubToken(stored);
    setTimeout(() => setGithubFeedback(null), 2000);
  };

  const handleRemoveGithubToken = () => {
    localStorage.removeItem('githubToken');
    setGithubToken('');
    setGithubTokenSaved(false);
    setGithubFeedback('Token removed.');
    setTimeout(() => setGithubFeedback(null), 2000);
  };

  const handleTestGithubToken = async () => {
    setGithubTesting(true);
    setGithubFeedback(null);
    try {
      const server = await MCPServerService.getServerById('github');
      if (!server || !server.apiUrl) {
        setGithubFeedback('GitHub MCP server not found.');
        setGithubTesting(false);
        return;
      }
      const result = await runMCPCommand(server.apiUrl, githubToken, 'Test authentication', {}, 'github');
      if (result && result.reply) {
        setGithubFeedback('Token is valid!');
      } else {
        setGithubFeedback('Token test failed: No reply from server.');
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
    <div className={`fixed inset-0 ${darkMode ? 'bg-black bg-opacity-80' : 'bg-black bg-opacity-50'} backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200`}>
      <Card className={`w-full max-w-lg relative animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-[#18181b] border-zinc-700 text-white' : ''}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <img src={provider.logo} alt={provider.name} className="w-16 h-16 rounded-xl mb-2" />
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
                    liveCommands.map((cmd, i) => (
                      <li key={i}>/{provider.id} {cmd}</li>
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
                  <Button onClick={handleSaveOpenAIApiKey} disabled={!openAIApiKey || openAIApiKeySaved} size="sm">
                    {openAIApiKeySaved ? 'Saved' : 'Save'}
                  </Button>
                  {openAIApiKeySaved && (
                    <Button onClick={handleRemoveOpenAIApiKey} variant="danger" size="sm">Remove</Button>
                  )}
                  <Button onClick={handleTestOpenAIApiKey} disabled={!openAIApiKey || openAITesting} size="sm" variant="secondary">
                    {openAITesting ? 'Testing...' : 'Test Key'}
                  </Button>
                </div>
                {openAIFeedback && (
                  <div className={`text-xs mt-1 ${openAIFeedback.includes('valid') ? 'text-green-600' : 'text-red-500'}`}>{openAIFeedback}</div>
                )}
                <span className="text-xs text-gray-500">Required for all OpenAI commands. Your key is stored locally and never shared.</span>
              </div>
            ) : provider.id === 'anthropic' ? (
              <AnthropicKeyManager darkMode={darkMode} feedback={anthropicFeedback} setFeedback={setAnthropicFeedback} testing={anthropicTesting} setTesting={setAnthropicTesting} />
            ) : provider.id === 'gemini' ? (
              <GeminiKeyManager darkMode={darkMode} feedback={geminiFeedback} setFeedback={setGeminiFeedback} testing={geminiTesting} setTesting={setGeminiTesting} />
            ) : provider.id === 'google_drive' ? (
              <DriveOAuthManager darkMode={darkMode} />
            ) : provider.id === 'gmail' ? (
              <GmailOAuthManager darkMode={darkMode} />
            ) : (
              <div className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Account management UI coming soon.</div>
            )}
            {provider.id === 'google_drive' && (
              <div className="flex flex-col space-y-2">
                {googleAccessToken ? (
                  <>
                    <span className="text-xs text-green-500">Connected as {userEmail || 'Google user'}</span>
                    <span className="text-xs text-gray-500">Using your main Google sign-in for Drive access.</span>
                  </>
                ) : (
                  <span className="text-xs text-red-500">Sign in with Google above to connect Drive.</span>
                )}
              </div>
            )}
            {provider.id === 'gmail' && (
              <div className="flex flex-col space-y-2">
                {googleAccessToken ? (
                  <>
                    <span className="text-xs text-green-500">Connected as {userEmail || 'Gmail user'}</span>
                    <span className="text-xs text-gray-500">Using your main Google sign-in for Gmail access.</span>
                  </>
                ) : (
                  <span className="text-xs text-red-500">Sign in with Google above to connect Gmail.</span>
                )}
              </div>
            )}
            {provider.id === 'github' ? (
              <GithubKeyManager
                darkMode={darkMode}
                feedback={githubFeedback}
                setFeedback={setGithubFeedback}
                testing={githubTesting}
                setTesting={setGithubTesting}
              />
            ) : (
              <div className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Account management UI coming soon.</div>
            )}
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
          <Button onClick={handleRemove} variant="danger" size="sm">Remove</Button>
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
          <Button onClick={handleRemove} variant="danger" size="sm">Remove</Button>
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
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setDriveEmail(payload.email || '');
      } catch {
        setDriveEmail('');
      }
    } else {
      setDriveEmail('');
    }
  }, []);

  const handleLoginSuccess = (cred: any) => {
    localStorage.setItem('googleToken', cred.credential);
    try {
      const payload = JSON.parse(atob(cred.credential.split('.')[1]));
      setDriveEmail(payload.email || '');
    } catch {
      setDriveEmail('');
    }
    setDriveToken(cred.credential);
  };

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
          <Button onClick={handleDisconnect} variant="danger" size="sm">Disconnect</Button>
        </>
      ) : (
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={() => alert('Google Drive login failed')}
          useOneTap={false}
          width={240}
        />
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
          <Button onClick={handleDisconnect} variant="danger" size="sm">Disconnect</Button>
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

  React.useEffect(() => {
    const stored = localStorage.getItem('github_token') || '';
    setGithubToken(stored);
    setGithubTokenSaved(!!stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('github_token', githubToken);
    setGithubTokenSaved(true);
    setFeedback('Token saved successfully!');
    setGithubToken(localStorage.getItem('github_token') || '');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleRemove = () => {
    localStorage.removeItem('github_token');
    setGithubToken('');
    setGithubTokenSaved(false);
    setFeedback('Token removed.');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const { MCPServerService } = await import('../../services/mcpServerService');
      const { runMCPCommand } = await import('../../services/mcpApiService');
      const server = await MCPServerService.getServerById('github');
      if (!server || !server.apiUrl) {
        setFeedback('GitHub MCP server not found.');
        setTesting(false);
        return;
      }
      const result = await runMCPCommand(server.apiUrl, githubToken, 'Test token', {}, 'github');
      // Accept output or login as valid
      if (result && (result.output || result.login)) {
        setFeedback('Token is valid!');
      } else {
        setFeedback('Token test failed: No reply from server.');
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
          <Button onClick={handleRemove} variant="danger" size="sm">Remove</Button>
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