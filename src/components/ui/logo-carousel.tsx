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

// List of local logo images from public/logos
const localLogos = [
  "/logos/jupyter-notebook.png",
  "/logos/clickhouse.svg",
  "/logos/Slack_icon_2019.svg.png",
  "/logos/chroma-logo.png",
  "/logos/Figma-logo.svg",
  "/logos/Brave_icon_lionface.png",
  "/logos/gemini_icon-logo_brandlogos.net_bqzeu.png",
  "/logos/openai-icon-505x512-pr6amibw.png",
  "/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp",
  "/logos/Octicons-mark-github.svg",
  "/logos/google-drive-icon-google-product-illustration-free-png.webp",
  "/logos/zapier-logo-svg-vector.svg",
  "/logos/Gmail_icon_(2020).svg (1).webp"
];

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
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
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

  const logoItems = (logos || localLogos).map(l => typeof l === 'string' ? { src: l, alt: '', href: undefined } : l);
  const logoImageSizeClasses = `${logoImageWidth} ${logoImageHeight} ${logoMaxWidth} ${logoMaxHeight}`.trim();

  const handleLogoClick = (logo: { src: string; alt?: string }) => {
    const provider = PROVIDERS.find(p => p.logo === logo.src);
    if (provider) {
      setSelectedProvider(provider);
      setModalOpen(true);
    }
  };

  return (
    <div className={`w-full py-2 lg:py-4 bg-background overflow-x-hidden ${containerClassName}`}>
      <div className="w-full px-4">
        <div className={`flex flex-col gap-6 items-start justify-start`}>
          <h2 className={`text-xl md:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular text-left ml-2 text-foreground ${titleClassName}`}>
            <TextRoll>{title}</TextRoll>
          </h2>
          <div>
            <Carousel setApi={setApi} className={`w-full ${carouselClassName}`} opts={{ loop: true }}>
              <CarouselContent className="w-full justify-start">
                {logoItems.map((logo, index) => (
                  <CarouselItem className={`basis-1/${itemsPerViewMobile} lg:basis-1/${itemsPerViewDesktop}`} key={index}>
                    <div className={`flex rounded-md ${logoContainerWidth} ${logoContainerHeight} items-center justify-center p-4 hover:bg-accent transition-colors ${logoClassName}`}>
                      <button onClick={() => handleLogoClick(logo)} className="focus:outline-none">
                        <img 
                          src={logo.src}
                          alt={logo.alt || `Logo ${index + 1}`}
                          className={`${logoImageSizeClasses} object-contain filter invert dark:invert-0`}
                        />
                      </button>
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