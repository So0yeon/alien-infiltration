import React from "react";

// 큰 버튼 — 초등학생도 누르기 쉬운 크기, 명확한 상태.
export function Button({ children, onClick, variant = "brand", size = "md", disabled, className = "" }) {
  const variants = {
    brand: "bg-brand text-white shadow-card hover:brightness-105 active:scale-[.98]",
    accent: "bg-accent text-ink shadow-card hover:brightness-105 active:scale-[.98]",
    good: "bg-good text-white hover:brightness-105 active:scale-[.98]",
    bad: "bg-bad text-white hover:brightness-105 active:scale-[.98]",
    ghost: "bg-white text-ink border-2 border-brand/20 hover:border-brand/40 active:scale-[.98]",
    soft: "bg-brand/10 text-brand hover:bg-brand/15 active:scale-[.98]",
  };
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-2xl",
    md: "px-6 py-3 text-base rounded-2xl",
    lg: "px-8 py-4 text-lg rounded-xl2",
    xl: "px-10 py-6 text-2xl rounded-xl3",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-bold transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`bg-panel rounded-xl3 p-6 sm:p-8 border border-brand/10 ${
        glow ? "shadow-glow" : "shadow-card"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand/10 text-brand",
    accent: "bg-accent/20 text-[#9a6a14]",
    good: "bg-good/15 text-[#1f8a3b]",
    bad: "bg-bad/15 text-[#c0354a]",
    muted: "bg-ink/5 text-ink/60",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

// 전체 화면 셸 — 미래 연구기지 배경.
export function Screen({ children, className = "" }) {
  return (
    <div className={`min-h-full bg-station ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}

export function Eyebrow({ children }) {
  return (
    <p className="text-xs font-bold tracking-[0.25em] text-brand/60 uppercase">{children}</p>
  );
}
