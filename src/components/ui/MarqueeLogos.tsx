import React, { useState } from 'react';
import { PROVIDERS, ProviderMeta } from '../../data/providers';
import { ProviderPortalModal } from './ProviderPortalModal';

interface MarqueeLogosProps {
  logos: { src: string; alt: string }[];
  darkMode?: boolean;
}

export const MarqueeLogos: React.FC<MarqueeLogosProps> = ({ logos, darkMode }) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderMeta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const whiteToColor: Record<string, string> = {
    '/logos/chatgptWHT.png': '/logos/openai-icon-505x512-pr6amibw.png',
    '/logos/anthropicwhiteSymbol.png': '/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp',
    '/logos/github.png': '/logos/Octicons-mark-github.svg',
  };

  const colorToWhite: Record<string, string> = {
    '/logos/openai-icon-505x512-pr6amibw.png': '/logos/chatgptWHT.png',
    '/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp': '/logos/anthropicwhiteSymbol.png',
    '/logos/Octicons-mark-github.svg': '/logos/github.png',
  };

  const logoItems = logos.map((l) => {
    let correctedSrc = l.src;
    if (!darkMode && whiteToColor[correctedSrc]) {
      correctedSrc = whiteToColor[correctedSrc];
    } else if (darkMode && colorToWhite[correctedSrc]) {
      correctedSrc = colorToWhite[correctedSrc];
    }
    const provider = PROVIDERS.find(
      (p) => p.logo === correctedSrc || p.logoDark === correctedSrc || p.name.toLowerCase() === l.alt.toLowerCase()
    );
    return { ...l, src: correctedSrc, provider } as { src: string; alt: string; provider?: ProviderMeta };
  });

  // Duplicate for seamless scroll
  const marqueeLogos = [...logoItems, ...logoItems];

  const handleLogoClick = (item: { src: string; alt: string; provider?: ProviderMeta }) => {
    if (item.provider) {
      setSelectedProvider(item.provider);
      setModalOpen(true);
    }
  };

  const getProviderId = (logo: { src: string; alt?: string }) => {
    const provider = PROVIDERS.find(p =>
      p.logo === logo.src || p.logoDark === logo.src ||
      (logo.alt && p.name.toLowerCase() === logo.alt.toLowerCase())
    );
    return provider ? provider.id : undefined;
  };

  return (
    <div className="relative w-full overflow-x-hidden py-6">
      <div
        className="flex items-center gap-20 animate-marquee"
        style={{ width: 'max-content', animation: 'marquee 30s linear infinite' }}
      >
        {marqueeLogos.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleLogoClick(item)}
            className="focus:outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
            style={{ background: 'none' }}
          >
            <img
              src={item.src}
              alt={item.alt}
              className="h-12 w-auto object-contain hover:scale-110 transition-transform duration-200"
              style={{ filter: item.src.endsWith('chatgptWHT.png') || item.src.endsWith('anthropicwhiteSymbol.png') || item.src.endsWith('github.png') ? undefined : (darkMode ? 'invert(0)' : 'invert(0)') }}
            />
          </button>
        ))}
      </div>
      <ProviderPortalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        provider={selectedProvider}
        darkMode={darkMode}
      />
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}; 