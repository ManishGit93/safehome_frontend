import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, eyebrow, actions }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 rounded-2xl bg-white/80 p-6 shadow-soft transition md:flex-row md:items-center md:justify-between">
    <div>
      {eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-brand">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
    </div>
    {actions}
  </div>
);


