'use client';

import { ArrowRight } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function AnimatedButton({
  children,
  onClick,
  className = '',
}: AnimatedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex h-16 items-center rounded-full bg-white pl-9 pr-3 shadow-[0_8px_30px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 ${className}`}
    >
      {/* ---- crossfade rolling text ---- */}
      <span className="relative mr-[18px] block h-4 overflow-hidden text-xs font-bold uppercase leading-4 tracking-[0.16em] text-black">
        {/* outgoing copy: slides up + fades out */}
        <span className="block h-4 leading-4 opacity-100 transition-all duration-[400ms] ease-[cubic-bezier(0.5,0,0.2,1)] group-hover:-translate-y-full group-hover:opacity-0">
          {children}
        </span>
        {/* incoming copy: rolls up from below + fades in */}
        <span className="absolute inset-0 block h-4 translate-y-full leading-4 opacity-0 transition-all duration-[400ms] ease-[cubic-bezier(0.5,0,0.2,1)] group-hover:translate-y-0 group-hover:opacity-100">
          {children}
        </span>
      </span>

      {/* ---- fixed slot keeps the pill from resizing ---- */}
      <span className="flex h-10 w-10 flex-none items-center justify-center">
        {/* circle: small dot -> grows to fill the slot */}
        <span className="flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded-full bg-orange-500 transition-all duration-300 ease-[cubic-bezier(0.5,0,0.2,1)] group-hover:h-10 group-hover:w-10">
          {/* arrow: tucked left, slides in left -> right */}
          <ArrowRight
            className="h-5 w-5 flex-none -translate-x-4 text-black opacity-0 transition-all duration-300 ease-[cubic-bezier(0.5,0,0.2,1)] group-hover:translate-x-0 group-hover:opacity-100"
            strokeWidth={2.5}
          />
        </span>
      </span>
    </button>
  );
}