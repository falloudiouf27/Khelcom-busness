import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeMap = {
    sm: { circle: 32, text: 'text-base', sub: 'text-[9px]' },
    md: { circle: 44, text: 'text-lg sm:text-xl', sub: 'text-[10px] sm:text-[11px]' },
    lg: { circle: 56, text: 'text-xl sm:text-2xl', sub: 'text-[11px] sm:text-xs' },
    xl: { circle: 72, text: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-3 min-w-0 ${className}`}>
      {/* Official circular emblem */}
      <svg
        width={currentSize.circle}
        height={currentSize.circle}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-200 w-8 h-8 sm:w-11 sm:h-11"
      >
        <defs>
          <radialGradient id="logoBgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3d156b" />
            <stop offset="65%" stopColor="#250946" />
            <stop offset="100%" stopColor="#16042b" />
          </radialGradient>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#6b21a8" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        {/* Outer Ring */}
        <circle cx="100" cy="100" r="97" fill="url(#ringGrad)" />
        <circle cx="100" cy="100" r="92" fill="#130424" />

        {/* Inner Gradient Disc */}
        <circle cx="100" cy="100" r="88" fill="url(#logoBgGrad)" />
        
        {/* Subtle inner highlight border */}
        <circle cx="100" cy="100" r="87" stroke="#6b21a8" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />

        {/* TOP ICON: Smartphone with orange waves */}
        <g transform="translate(85, 24)">
          {/* Phone body */}
          <rect x="5" y="4" width="18" height="28" rx="4" fill="#16062b" stroke="#7e22ce" strokeWidth="2.5" />
          {/* Phone screen */}
          <rect x="8" y="8" width="12" height="17" rx="1.5" fill="#2d0b52" />
          {/* Home button */}
          <circle cx="14" cy="28.5" r="1" fill="#7e22ce" />
          
          {/* Orange Wireless Waves */}
          <path d="M 23 18 C 25 15, 27 12, 31 10" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 23 23 C 26 21, 28 18, 32 15" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 23 28 C 28 26, 31 22, 34 18" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>

        {/* TEXT: Khelcom (White) */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="35"
          letterSpacing="-0.5px"
        >
          Khelcom
        </text>

        {/* TEXT: business (Vibrant Orange) */}
        <text
          x="100"
          y="136"
          textAnchor="middle"
          fill="#f97316"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="27"
          letterSpacing="-0.3px"
        >
          business
        </text>

        {/* BOTTOM ACCENT: Line & Shopping Cart */}
        <g transform="translate(0, 142)">
          {/* Left line */}
          <line x1="50" y1="16" x2="84" y2="16" stroke="#581c87" strokeWidth="1.5" strokeLinecap="round" />
          {/* Shopping cart icon in center */}
          <g transform="translate(93, 11) scale(0.6)">
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="9" cy="21" r="1.5" fill="#7e22ce" />
            <circle cx="19" cy="21" r="1.5" fill="#7e22ce" />
          </g>
          {/* Right line */}
          <line x1="116" y1="16" x2="150" y2="16" stroke="#581c87" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Brand Text (Optional / Next to Logo) */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-white ${currentSize.text}`}>
              Khelcom
            </span>
            <span className={`font-extrabold tracking-tight text-orange-500 ${currentSize.text}`}>
              business
            </span>
          </div>
          <span className={`text-purple-300/80 font-medium tracking-wide uppercase mt-0.5 truncate hidden sm:block ${currentSize.sub}`}>
            Électronique & Électroménager • Nianing
          </span>
          <span className={`text-purple-300/80 font-medium tracking-wide uppercase mt-0.5 sm:hidden text-[9px] truncate`}>
            Nianing • Showroom
          </span>
        </div>
      )}
    </div>
  );
};
