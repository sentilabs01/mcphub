import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { verifyGithubToken, fetchSavedGithubToken, saveGithubToken, deleteGithubToken } from '../../services/githubService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

// Utility to mask PAT for display (ghp_****tail)
function maskToken(token: string) {
  if (!token) return '';
  if (token.length <= 8) return '********';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, darkMode }) => {
  const [githubToken, setGithubToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // When modal opens, load saved token
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchSavedGithubToken()
      .then((tkn) => {
        setGithubToken(tkn);
        setSaved(!!tkn);
        if (tkn) {
          try {
            localStorage.setItem('github_token', tkn);
          } catch {
            /* ignore */
          }
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await saveGithubToken(githubToken);
      setSaved(true);
      try {
        localStorage.setItem('github_token', githubToken);
      } catch {}
      setFeedback('Token saved to your account.');
    } catch (err: any) {
      setFeedback(err.message || 'Failed to save token');
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove saved GitHub token?')) return;
    setLoading(true);
    setFeedback(null);
    try {
      await deleteGithubToken();
      setGithubToken('');
      setSaved(false);
      try { localStorage.removeItem('github_token'); } catch {}
      setFeedback('Token deleted.');
    } catch (err: any) {
      setFeedback(err.message || 'Failed to delete token');
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const user = await verifyGithubToken(githubToken);
      setFeedback(`Token valid for @${user.login}`);
    } catch (err: any) {
      setFeedback(err.message || 'Invalid token');
    } finally {
      setTesting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-md rounded-lg border shadow-lg ${darkMode ? 'bg-[#232323] border-zinc-700 text-white' : 'bg-white border-gray-200 text-black'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex flex-col space-y-4">
          {/* GitHub Token Section */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">GitHub Personal Access Token</label>
            {saved && !loading ? (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-600">Saved ({maskToken(githubToken)})</span>
                <Button variant="outline" size="sm" onClick={() => setSaved(false)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
                <Button variant="secondary" size="sm" onClick={handleTest} disabled={testing}>{testing ? 'Testing...' : 'Test'}</Button>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  className={`border rounded px-3 py-2 text-sm ${darkMode ? 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-400' : ''}`}
                />
                <div className="flex items-center space-x-2">
                  <Button onClick={handleSave} disabled={!githubToken || loading} size="sm">{loading ? 'Saving...' : 'Save'}</Button>
                  <Button variant="secondary" size="sm" onClick={handleTest} disabled={!githubToken || testing}>{testing ? 'Testing...' : 'Test'}</Button>
                </div>
              </>
            )}
            {feedback && <span className={`text-xs ${feedback.includes('valid') || feedback.includes('saved') ? 'text-green-600' : 'text-red-500'}`}>{feedback}</span>}
            <span className="text-xs text-gray-500">Stored securely on backend; never shared.</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 