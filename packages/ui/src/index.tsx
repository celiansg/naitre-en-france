import type { ReactNode } from "react";

export function SectionLabel({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "coral" | "sage" | "gold" }) {
  return <span className={`section-label section-label--${tone}`}>{children}</span>;
}

export function StatBar({ label, value, tone = "blue", note }: { label: string; value: number; tone?: "blue" | "coral" | "sage" | "gold"; note?: string }) {
  return (
    <div className="stat-bar" aria-label={`${label}: ${Math.round(value)} sur 100`}>
      <div className="stat-bar__head"><span>{label}</span><strong>{Math.round(value)}</strong></div>
      <div className="stat-bar__track"><span className={`stat-bar__fill stat-bar__fill--${tone}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></div>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function SourceBadge({ label = "Démo synthétique" }: { label?: string }) {
  return <span className="source-badge"><span className="source-badge__dot" aria-hidden="true" />{label}</span>;
}

export function Icon({ name, alt = "", className = "" }: { name: string; alt?: string; className?: string }) {
  return <img className={`icon ${className}`} src={`/kit/assets/icons/${name}.svg`} alt={alt} aria-hidden={alt ? undefined : true} />;
}

export function ArrowButton({ children, onClick, disabled = false, variant = "primary", type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "quiet" | "outline"; type?: "button" | "submit" }) {
  return <button type={type} className={`arrow-button arrow-button--${variant}`} onClick={onClick} disabled={disabled}>{children}<span aria-hidden="true">↗</span></button>;
}
