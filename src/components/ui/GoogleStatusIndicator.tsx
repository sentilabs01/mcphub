import React, { useEffect, useState } from 'react';
import { Cloud } from 'lucide-react';

/**
 * Shows whether the user is currently authenticated with Google.
 * A simple heuristic is used: if a token exists in localStorage under
 * `google_access_token` or `google_token`, the user is considered connected.
 * The indicator refreshes itself every few seconds so that changes made in
 * other tabs (e.g. via the Integrations portal) are reflected quickly.
 */
export const GoogleStatusIndicator: React.FC = () => {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const tok = localStorage.getItem('google_access_token') || localStorage.getItem('google_token');
      setConnected(tok ? true : false);
    };

    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-base font-medium">
      <Cloud className="w-5 h-5" />
      <span>Google: {connected === null ? 'Checking...' : connected ? 'Connected' : 'Disconnected'}</span>
      <span
        className={`inline-block w-3 h-3 rounded-full ml-1 ${
          connected === null ? 'bg-gray-400' : connected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
    </div>
  );
}; 