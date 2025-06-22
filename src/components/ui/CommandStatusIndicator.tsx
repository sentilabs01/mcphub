import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Listens for `mcp:command-start` / `mcp:command-end` events dispatched globally
 * by ChatBar (and potentially other components) and shows a spinner while
 * at least one command is running.
 */
export const CommandStatusIndicator: React.FC = () => {
  const [inFlight, setInFlight] = useState(0);

  useEffect(() => {
    const handleStart = () => setInFlight((c) => c + 1);
    const handleEnd = () => setInFlight((c) => Math.max(0, c - 1));
    window.addEventListener('mcp:command-start', handleStart);
    window.addEventListener('mcp:command-end', handleEnd);
    return () => {
      window.removeEventListener('mcp:command-start', handleStart);
      window.removeEventListener('mcp:command-end', handleEnd);
    };
  }, []);

  if (inFlight === 0) return null;

  return (
    <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
      <LoadingSpinner size="sm" />
      <span>Running…</span>
    </div>
  );
}; 