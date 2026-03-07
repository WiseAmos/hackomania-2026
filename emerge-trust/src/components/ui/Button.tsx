import { type ButtonHTMLAttributes, forwardRef } from "react";
import { useAppStore } from "@/store/appState";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  small?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      small = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const { mode } = useAppStore();

    const base =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2";

    const sizes: Record<Size, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    const peacetimeVariants: Record<Variant, string> = {
      primary:
        "bg-pt-cyan text-pt-bg hover:bg-pt-cyan-dim focus-visible:ring-pt-cyan",
      secondary:
        "bg-pt-panel text-pt-text border border-pt-muted/30 hover:bg-pt-surface focus-visible:ring-pt-muted",
      ghost:
        "bg-transparent text-pt-cyan hover:bg-pt-panel focus-visible:ring-pt-cyan",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    };

    const crisisVariants: Record<Variant, string> = {
      primary:
        "bg-cr-orange text-white hover:bg-cr-red focus-visible:ring-cr-orange",
      secondary:
        "bg-cr-surface text-cr-text border border-cr-orange/40 hover:bg-cr-panel focus-visible:ring-cr-orange",
      ghost:
        "bg-transparent text-cr-orange hover:bg-cr-surface focus-visible:ring-cr-orange",
      danger:
        "bg-cr-red text-white hover:bg-red-700 focus-visible:ring-cr-red",
    };

    const variants =
      mode === "crisis" ? crisisVariants : peacetimeVariants;

    return (
      <button
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        disabled={disabled || isLoading}
        data-small={small ? "true" : undefined}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
