import React, { useEffect, useState } from 'react';
import { AuthProvider } from './components/auth/AuthProvider';
import { MarketplaceSearchProvider } from './components/marketplace/MarketplaceSearchContext';
import { ChatBarInputProvider } from './context/ChatBarInputContext';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/auth/AuthModal';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { ChatBar } from './components/ui/ChatBar';
import { IntegrationsGallery } from './components/ui/IntegrationsGallery';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Chrome, Sun, Moon, Minus } from 'lucide-react';
import { CarouselDemo } from './components/ui/carousel-demo';
import { Avatar, AvatarImage } from './components/ui/avatar';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { ServerStatusIndicator } from './components/ui/ServerStatusIndicator';
// import { EnhancedChatUI } from './components/ui/EnhancedChatUI';
// import { useAuth } from './hooks/useAuth';
// import { AuthModal } from './components/auth/AuthModal';
// import { ChatBar } from './components/ui/ChatBar';
// import { Integrations } from './components/ui/Integrations';
// import { IntegrationsGallery } from './components/ui/IntegrationsGallery';
// import { GoogleOAuthProvider } from '@react-oauth/google';
// import { GoogleLogin, googleLogout } from '@react-oauth/google';
// import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = '652950111934-...apps.googleusercontent.com';

function MinimalAppContent() {
  const { user, loading, signOut } = useAuth();
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
      <div className="absolute top-4 right-4 flex space-x-2 items-center z-50">
        <ServerStatusIndicator />
        <Button
          variant="ghost"
          onClick={() => setDarkMode(dm => !dm)}
          className="flex items-center gap-2"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="sr-only">Toggle dark mode</span>
        </Button>
        {/* Minimized chat icon */}
        {chatMinimized && (
          <button
            onClick={() => setChatMinimized(false)}
            className="ml-2 p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Open chat"
          >
            <Minus className="w-6 h-6" />
          </button>
        )}
        <div className="relative group">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.picture || ''} alt={user?.email || 'User'} />
          </Avatar>
          <div className={`absolute right-0 mt-2 w-32 rounded shadow-lg z-50 ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-black'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button onClick={signOut} className="block w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Sign Out</button>
          </div>
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
              bottom: { height: '18px', bottom: 0, left: 0, right: 0, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', cursor: 's-resize', transition: 'background 0.2s' },
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
              <ChatBar />
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