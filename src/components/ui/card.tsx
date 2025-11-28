import clsx from "clsx";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted";
}

export const Card = ({ className, variant = "default", ...props }: CardProps) => (
  <div
    className={clsx(
      "rounded-2xl border bg-white shadow-soft",
      variant === "muted" && "bg-white/80 border-slate-100",
      className,
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("px-6 pt-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx("text-xl font-semibold text-slate-900", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx("text-sm text-slate-500", className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("px-6 pb-6", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("px-6 pb-6 pt-2", className)} {...props} />
);


