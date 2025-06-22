import { MarqueeLogos } from './MarqueeLogos';
import { PROVIDERS } from '../../data/providers';

const HIDDEN_PROVIDER_IDS = new Set(["slack", "chroma", "jupyter", "lovable"]);

const partnerLogos = PROVIDERS.filter(p => !HIDDEN_PROVIDER_IDS.has(p.id)).map(p => ({ src: p.logo, alt: p.name }));

export const CarouselDemo = ({ darkMode }: { darkMode?: boolean }) => {
  return (
    <div className="w-screen h-screen flex flex-col items-start justify-center">
      <h2 className={`text-xl md:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular text-left ml-4 md:ml-12 lg:ml-20 ${darkMode ? 'text-white' : 'text-black'}`}>MCP Messenger</h2>
      <MarqueeLogos logos={partnerLogos} darkMode={darkMode} />
    </div>
  );
}; 