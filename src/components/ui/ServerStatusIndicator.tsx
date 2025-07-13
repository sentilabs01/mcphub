import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { backendBase } from '../../utils/backendBase';

export const ServerStatusIndicator: React.FC = () => {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch(`${backendBase}/api/health`, { method: 'GET' });
        if (isMounted) setOnline(res.ok);
      } catch {
        if (isMounted) setOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center space-x-2 text-base font-medium">
      <Globe className="w-5 h-5" />
      <span>Server: {online === null ? 'Checking...' : online ? 'Running' : 'Disconnected'}</span>
      <span
        className={`inline-block w-3 h-3 rounded-full ml-1 ${
          online === null ? 'bg-gray-400' : online ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
    </div>
  );
}; 