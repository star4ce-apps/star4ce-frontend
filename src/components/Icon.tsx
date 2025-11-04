'use client';
import { useEffect, useState } from 'react';

interface IconProps {
  src: string;
  alt: string;
  className?: string;
  color?: string;
}

export default function Icon({ src, alt, className = '', color }: IconProps) {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        // Replace currentColor with the specified color
        const coloredSvg = color 
          ? text.replace(/currentColor/g, color)
          : text;
        // Ensure SVG has proper display attributes
        const finalSvg = coloredSvg.replace(
          '<svg',
          `<svg class="${className}"`
        );
        setSvgContent(finalSvg);
      })
      .catch((err) => console.error('Failed to load icon:', err));
  }, [src, color, className]);

  if (!svgContent) return <div className={className} />;

  return (
    <span
      className="inline-block"
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-label={alt}
    />
  );
}

