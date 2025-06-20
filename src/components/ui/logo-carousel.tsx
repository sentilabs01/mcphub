"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./carousel";
import { TextRoll } from "./text-roll";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Sun, Moon } from "lucide-react";
import { ProviderPortalModal } from "./ProviderPortalModal";
import { PROVIDERS } from "../../data/providers";
import type { ProviderMeta } from "../../data/providers";

// Providers to hide from carousel
const HIDDEN_PROVIDER_IDS = new Set(["chroma", "jupyter", "figma", "bolt", "21st_dev"]);

// Filtered list used throughout this component
const ACTIVE_PROVIDERS = PROVIDERS.filter(p => !HIDDEN_PROVIDER_IDS.has(p.id));

// Build default logo list from PROVIDERS (unique)
const localLogos = Array.from(new Set([
  ...ACTIVE_PROVIDERS.map(p => p.logo),
  ...ACTIVE_PROVIDERS.flatMap(p => (p.logoDark ? [p.logoDark] : []))
]));

export const AnimatedCarousel = ({
  title = "Trusted by thousands of businesses worldwide",
  logoCount = 13,
  autoPlay = true,
  autoPlayInterval = 1000,
  logos = null, // Array of image URLs
  containerClassName = "",
  titleClassName = "",
  carouselClassName = "",
  logoClassName = "",
  itemsPerViewMobile = 4,
  itemsPerViewDesktop = 6,
  spacing = "gap-10",
  padding = "py-20 lg:py-40",
  logoContainerWidth = "w-48",
  logoContainerHeight = "h-24",
  logoImageWidth = "w-full",
  logoImageHeight = "h-full",
  logoMaxWidth = "",
  logoMaxHeight = "",
  darkMode = false,
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderMeta | null>(null);

  useEffect(() => {
    if (!api || !autoPlay) {
      return;
    }

    const timer = setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, autoPlayInterval);

    return () => clearTimeout(timer);
  }, [api, current, autoPlay, autoPlayInterval]);

  // Map white/dark variants back to colored versions when in light mode
  const whiteToColor: Record<string, string> = {
    '/logos/chatgptWHT.png': '/logos/openai-icon-505x512-pr6amibw.png',
    '/logos/anthropicwhiteSymbol.png': '/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp',
    '/logos/github.png': '/logos/Octicons-mark-github.svg',
    '/logos/cursor.png': '/logos/cursor light mode(1).png',
  };

  const colorToWhite: Record<string, string> = {
    '/logos/openai-icon-505x512-pr6amibw.png': '/logos/chatgptWHT.png',
    '/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp': '/logos/anthropicwhiteSymbol.png',
    '/logos/Octicons-mark-github.svg': '/logos/github.png',
    '/logos/cursor light mode(1).png': '/logos/cursor.png',
  };

  const logoItems = (logos || localLogos).map(raw => {
    const obj = typeof raw === 'string' ? { src: raw, alt: '', href: undefined } : raw;
    let correctedSrc = obj.src;
    if (!darkMode && whiteToColor[correctedSrc]) {
      correctedSrc = whiteToColor[correctedSrc];
    } else if (darkMode && colorToWhite[correctedSrc]) {
      correctedSrc = colorToWhite[correctedSrc];
    }
    return { ...obj, src: correctedSrc };
  });
  const logoImageSizeClasses = `${logoImageWidth} ${logoImageHeight} ${logoMaxWidth} ${logoMaxHeight}`.trim();

  const findProvider = (logo: { src: string; alt?: string }) => {
    // Try to match by logo src or alt (provider name, case-insensitive)
    return ACTIVE_PROVIDERS.find(p =>
      p.logo === logo.src || p.logoDark === logo.src ||
      (logo.alt && p.name.toLowerCase() === logo.alt.toLowerCase())
    );
  };

  const handleLogoClick = (logo: { src: string; alt?: string }) => {
    const provider = findProvider(logo);
    if (provider) {
      setSelectedProvider(provider);
      setModalOpen(true);
    }
  };

  const getProviderId = (logo: { src: string; alt?: string }) => {
    const provider = findProvider(logo);
    return provider ? provider.id : undefined;
  };

  return (
    <div className={`w-full py-2 lg:py-4 bg-transparent overflow-x-hidden ${containerClassName}`}>
      <div className="w-full px-4">
        <div className={`flex flex-col gap-6 items-start justify-start`}>
          <h2 className={`text-xl md:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular text-left ml-4 md:ml-12 lg:ml-20 ${darkMode ? 'text-white' : 'text-black'} ${titleClassName}`}>
            <TextRoll>{title}</TextRoll>
          </h2>
          <div>
            <Carousel setApi={setApi} className={`w-full ${carouselClassName}`} opts={{ loop: true }}>
              <CarouselContent className="w-full justify-start">
                {logoItems.map((logo, index) => (
                  <CarouselItem className={`basis-1/${itemsPerViewMobile} lg:basis-1/${itemsPerViewDesktop}`} key={index}>
                    <div className={`relative flex rounded-md ${logoContainerWidth} ${logoContainerHeight} items-center justify-center p-4 hover:bg-accent transition-colors ${logoClassName}`} style={{ zIndex: 1 }}>
                      {getProviderId(logo) ? (
                        <a
                          href={`/portal/${getProviderId(logo)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => {
                            e.preventDefault();
                            handleLogoClick(logo);
                          }}
                          className="focus:outline-none block w-full h-full"
                        >
                          <img
                            src={logo.src}
                            alt={logo.alt || `Logo ${index + 1}`}
                            className={`${logoImageSizeClasses} object-contain ${logo.src.endsWith('chatgptWHT.png') || logo.src.endsWith('anthropicwhiteSymbol.png') || logo.src.endsWith('github.png') || logo.src.endsWith('Slack_icon_2019.svg.png') || logo.src.endsWith('cursor light mode(1).png') || logo.src.endsWith('cursor.png') ? '' : 'filter invert dark:invert-0'}`}
                          />
                        </a>
                      ) : (
                        <img
                          src={logo.src}
                          alt={logo.alt || `Logo ${index + 1}`}
                          className={`${logoImageSizeClasses} object-contain ${logo.src.endsWith('chatgptWHT.png') || logo.src.endsWith('anthropicwhiteSymbol.png') || logo.src.endsWith('github.png') || logo.src.endsWith('Slack_icon_2019.svg.png') || logo.src.endsWith('cursor light mode(1).png') || logo.src.endsWith('cursor.png') ? '' : 'filter invert dark:invert-0'}`}
                        />
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
      <ProviderPortalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} provider={selectedProvider} />
    </div>
  );
};

export const Case1 = (props: React.ComponentProps<typeof AnimatedCarousel>) => {
  return <AnimatedCarousel {...props} />;
}; 