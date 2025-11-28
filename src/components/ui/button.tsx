"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-soft hover:-translate-y-0.5 hover:bg-brand-dark",
  secondary: "bg-accent-muted text-brand hover:bg-accent-light/40",
  ghost: "bg-transparent text-brand hover:bg-brand-muted/60 hover:text-brand-dark",
  danger: "bg-danger text-white hover:bg-danger/80",
  subtle: "bg-white/70 text-slate-700 border border-slate-200 hover:border-brand/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = "primary", size = "md", icon, isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
        )}
        {!isLoading && icon}
        <span>{children}</span>
      </button>
    );
  },
);

Button.displayName = "Button";


