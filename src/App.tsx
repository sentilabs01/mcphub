import React, { useEffect, useState } from 'react';
import { AuthProvider } from './components/auth/AuthProvider';
import { MarketplaceSearchProvider } from './components/marketplace/MarketplaceSearchContext';
import { ChatBarInputProvider } from './context/ChatBarInputContext';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/auth/AuthModal';
import { Button } from './components/ui/Button';
import { ChatBar } from './components/ui/ChatBar';
import { IntegrationsGallery } from './components/ui/IntegrationsGallery';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Chrome, Sun, Moon, Minus, MessageCircle } from 'lucide-react';
import { CarouselDemo } from './components/ui/carousel-demo';
import { Avatar, AvatarImage } from './components/ui/avatar';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { ServerStatusIndicator } from './components/ui/ServerStatusIndicator';
import { IntegrationsDropdown } from './components/ui/IntegrationsDropdown';
import { useSupabaseCredentialSync } from './hooks/useSupabaseCredentialSync';
import { CommandStatusIndicator } from './components/ui/CommandStatusIndicator';
import { useGoogleAutoRefresh } from './hooks/useGoogleAutoRefresh';
// import { EnhancedChatUI } from './components/ui/EnhancedChatUI';
// import { useAuth } from './hooks/useAuth';
// import { AuthModal } from './components/auth/AuthModal';
// import { ChatBar } from './components/ui/ChatBar';
// import { Integrations } from './components/ui/Integrations';
// import { IntegrationsGallery } from './components/ui/IntegrationsGallery';
// import { GoogleOAuthProvider } from '@react-oauth/google';
// import { GoogleLogin, googleLogout } from '@react-oauth/google';
// import { jwtDecode } from 'jwt-decode';

// Use env variable to avoid stale hard-coded IDs
// Ensure VITE_GOOGLE_CLIENT_ID is defined in your .env (and re-start Vite after editing)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string || '';

function MinimalAppContent() {
  const { user, loading, signOut, signInWithGoogle } = useAuth();
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Chat box size persistence
  const defaultSize = { width: 800, height: 520 };
  const [chatBoxSize, setChatBoxSize] = useState<{ width: number; height: number }>(() => {
    const saved = localStorage.getItem('chatBoxSize');
    return saved ? JSON.parse(saved) : defaultSize;
  });
  // Chat box minimized state
  const [chatMinimized, setChatMinimized] = useState(() => {
    const saved = localStorage.getItem('chatMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  useEffect(() => {
    localStorage.setItem('chatBoxSize', JSON.stringify(chatBoxSize));
  }, [chatBoxSize]);
  useEffect(() => {
    localStorage.setItem('chatMinimized', JSON.stringify(chatMinimized));
  }, [chatMinimized]);

  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  // Keep local tokens in sync with Supabase changes
  useSupabaseCredentialSync(user?.id);

  // Keep Google access_token fresh
  useGoogleAutoRefresh();

  // Google connection state – controls coloured dot on avatar
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    const update = () => {
      const tok = localStorage.getItem('google_access_token') || localStorage.getItem('google_token');
      const exp = Number(localStorage.getItem('google_access_token_exp') || '0');
      const valid = !!tok && (!exp || Date.now() < exp - 60_000);
      setGoogleConnected(valid);
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, []);

  const disconnectGoogle = () => {
    ['google_access_token', 'google_access_token_exp', 'google_token', 'googleToken'].forEach((k) =>
      localStorage.removeItem(k)
    );
    setGoogleConnected(false);
  };

  // Avatar menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const menuEl = document.getElementById('avatar-menu');
      if (menuEl && !menuEl.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  if (loading) {
    return <div className={`min-h-screen flex items-center justify-center text-xl ${darkMode ? 'bg-black text-white' : 'bg-gray-50'}`}>Loading...</div>;
  }

  if (!user) {
    return (
      <>
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              onClick={() => setAuthModalOpen(true)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-3 py-2 px-4"
            >
              <Chrome className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Sign in</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDarkMode(dm => !dm)}
              className="flex items-center gap-2"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
          </div>
          <div className="w-full px-6 lg:pl-20 text-left flex flex-col items-start">
            <CarouselDemo darkMode={darkMode} />
          </div>
        </div>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    );
  }

  return (
    <div className={`min-h-[100vh] h-auto w-full flex flex-col items-center justify-start py-12 bg-white dark:bg-black ${darkMode ? 'text-white' : 'text-black'}`}>
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 z-50">
        <div className="flex items-center space-x-2">
          <ServerStatusIndicator />
          <CommandStatusIndicator />
          <Button
            variant="ghost"
            onClick={() => setDarkMode(dm => !dm)}
            className="flex items-center gap-2"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="sr-only">Toggle dark mode</span>
          </Button>
          {chatMinimized && (
            <button
              onClick={() => setChatMinimized(false)}
              className="ml-2 p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Open chat"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          )}
          <div className="relative group">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.picture || ''} alt={user?.email || 'User'} />
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${googleConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={googleConnected ? 'Google connected' : 'Google not connected'}
            />
            <button
              className="absolute inset-0 w-full h-full rounded-full focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              <span className="sr-only">Avatar menu</span>
            </button>
            {menuOpen && (
              <div
                id="avatar-menu"
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-lg z-50"
              >
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700"
                  onClick={() => {
                    setMenuOpen(false);
                    disconnectGoogle();
                  }}
                >
                  Disconnect Google
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                >
                  Log out
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700"
                  onClick={() => {
                    setMenuOpen(false);
                    signInWithGoogle();
                  }}
                >
                  Switch Google account
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Integrations dropdown */}
        <div className="self-start">
          <IntegrationsDropdown darkMode={darkMode} />
        </div>
      </div>
      {/* Carousel as background */}
      <div className="fixed inset-0 w-full h-[320px] z-0 select-none bg-transparent">
        <CarouselDemo darkMode={darkMode} />
      </div>
      {/* Main content (can be empty or minimal) */}
      <div className="relative z-10 w-full min-h-[320px]" />

      {/* Chat bar as draggable and resizable, only if not minimized */}
      {!chatMinimized && (
        <Draggable
          defaultPosition={{
            x: typeof window !== 'undefined' ? (window.innerWidth - chatBoxSize.width) / 2 : 0,
            y: 40
          }}
          bounds="body"
          handle=".chatbar-drag-handle"
        >
          <Resizable
            size={chatBoxSize}
            onResizeStop={(e, direction, ref, d) => {
              setChatBoxSize((prev) => ({
                width: prev.width + d.width,
                height: prev.height + d.height
              }));
            }}
            minWidth={640}
            minHeight={240}
            maxWidth={1200}
            maxHeight={Math.max(320, viewportHeight - 80)}
            enable={{
              top: false,
              bottom: true,
              left: true,
              right: true,
              bottomLeft: true,
              bottomRight: true,
              topLeft: false,
              topRight: false,
            }}
            handleStyles={{
              bottomRight: { width: '18px', height: '18px', right: 0, bottom: 0, background: 'transparent', borderRadius: '0 0 8px 0', cursor: 'se-resize', transition: 'background 0.2s' },
              bottomLeft: { width: '18px', height: '18px', left: 0, bottom: 0, background: 'transparent', borderRadius: '0 0 0 8px', cursor: 'sw-resize', transition: 'background 0.2s' },
              bottom: { height: '18px', bottom: 0, left: 0, right: 0, background: 'transparent', cursor: 's-resize', transition: 'background 0.2s' },
              left: { width: '10px', left: 0, top: '18px', bottom: '18px', background: 'transparent', cursor: 'w-resize', transition: 'background 0.2s' },
              right: { width: '10px', right: 0, top: '18px', bottom: '18px', background: 'transparent', cursor: 'e-resize', transition: 'background 0.2s' },
            }}
            className="z-50 fixed bg-transparent border-none shadow-none"
          >
            <div className="chatbar-drag-handle cursor-move w-full h-6 bg-zinc-800/80 rounded-t-lg flex items-center px-3 text-xs text-white select-none justify-between">
              <span>Chat</span>
              <button
                onClick={() => setChatMinimized(true)}
                className="ml-auto p-1 rounded hover:bg-zinc-700/40"
                aria-label="Minimize chat"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 w-full h-[calc(100%-1.5rem)] flex flex-col">
              <ChatBar darkMode={darkMode} />
            </div>
          </Resizable>
        </Draggable>
      )}

      <div className="w-full max-w-2xl mx-auto">
        <IntegrationsGallery darkMode={darkMode} />
      </div>
      <div className="w-full h-16" /> {/* Spacer for sticky chat bar */}
      {/* TODO: Restore ProviderPortalModal, per-provider portals, etc. here */}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <MarketplaceSearchProvider>
          <ChatBarInputProvider>
            <MinimalAppContent />
          </ChatBarInputProvider>
        </MarketplaceSearchProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}