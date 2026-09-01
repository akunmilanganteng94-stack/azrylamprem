import React from 'react';

export const ALIGHT_MOTION_PRODUCT_LOGO = 'https://cdn.phototourl.com/member/2026-09-01-1d4cc7dc-2e14-491c-b71f-d3320e266c69.jpg';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AlightMotionLogo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative ${iconSizes[size]} rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          <img
            src={ALIGHT_MOTION_PRODUCT_LOGO}
            alt="Alight Motion Logo"
            className="w-full h-full object-cover rounded-[10px]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-bold tracking-tight text-white font-['Poppins'] ${textSizes[size]}`}>
              ALIGHT<span className="text-emerald-400">MOTION</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PREMIUM
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            Automated Fast Delivery
          </span>
        </div>
      )}
    </div>
  );
}
