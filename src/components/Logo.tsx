import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

export default function Logo({ className = '', size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: { circle: 'w-5 h-5', star: 'w-4 h-4', text: 'text-lg' },
    md: { circle: 'w-6 h-6', star: 'w-5 h-5', text: 'text-xl' },
    lg: { circle: 'w-7 h-7', star: 'w-6 h-6', text: 'text-2xl' },
  };

  const sizes = sizeClasses[size];
  const textColor = variant === 'white' ? 'text-white' : 'text-[#0B2E65]';
  const circleBg = variant === 'white' ? 'bg-white' : 'bg-[#0B2E65]';
  const starColor = variant === 'white' ? 'text-[#0B2E65]' : 'text-white';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Circle with star */}
      <div className={`${sizes.circle} ${circleBg} rounded-full flex items-center justify-center flex-shrink-0`}>
        <svg
          className={`${sizes.star} ${starColor}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
      
      {/* Star4ce text */}
      <div className={`${sizes.text} font-bold`}>
        <span className={textColor}>Star</span>
        <span className="text-red-600">4</span>
        <span className={textColor}>ce</span>
      </div>
    </div>
  );
}

