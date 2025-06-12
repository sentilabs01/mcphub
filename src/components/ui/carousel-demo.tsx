import { AnimatedCarousel } from "./logo-carousel";

const partnerLogos = [
  { src: "/logos/jupyter-notebook.png", alt: "Jupyter" },
  { src: "/logos/clickhouse.svg", alt: "ClickHouse" },
  { src: "/logos/Slack_icon_2019.svg.png", alt: "Slack" },
  { src: "/logos/chroma-logo.png", alt: "Chroma" },
  { src: "/logos/Figma-logo.svg", alt: "Figma" },
  { src: "/logos/Brave_icon_lionface.png", alt: "Brave" },
  { src: "/logos/gemini_icon-logo_brandlogos.net_bqzeu.png", alt: "Gemini" },
  { src: "/logos/openai-icon-505x512-pr6amibw.png", alt: "OpenAI" },
  { src: "/logos/anthropic-icon-tdvkiqisswbrmtkiygb0ia.webp", alt: "Anthropic" },
  { src: "/logos/Octicons-mark-github.svg", alt: "GitHub" },
  { src: "/logos/google-drive-icon-google-product-illustration-free-png.webp", alt: "Google Drive" },
  { src: "/logos/zapier-logo-svg-vector.svg", alt: "Zapier" },
  { src: "/logos/Gmail_icon_(2020).svg (1).webp", alt: "Gmail" },
];

export const CarouselDemo = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <AnimatedCarousel 
        title="Powering the Web"
        logos={partnerLogos}
        autoPlay={true}
        autoPlayInterval={4000}
        itemsPerViewMobile={3}
        itemsPerViewDesktop={5}
        logoContainerWidth="w-40"
        logoContainerHeight="h-20"
        logoImageWidth="w-auto"
        logoImageHeight="h-10"
      />
    </div>
  );
}; 