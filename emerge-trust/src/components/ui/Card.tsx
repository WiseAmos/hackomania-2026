import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

function Card({ glow = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5
        ${glow ? "shadow-[0_0_24px_rgba(0,240,255,0.08)]" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
