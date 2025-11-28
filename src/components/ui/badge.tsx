import clsx from "clsx";

type BadgeVariant = "brand" | "muted" | "success" | "warning" | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  brand: "bg-brand/10 text-brand border border-brand/20",
  muted: "bg-slate-100 text-slate-600 border border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  danger: "bg-danger-light text-danger border border-danger/30",
};

export const Badge = ({ className, children, variant = "brand", ...props }: BadgeProps) => (
  <span
    className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", variantMap[variant], className)}
    {...props}
  >
    {children}
  </span>
);


