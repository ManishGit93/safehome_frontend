import clsx from "clsx";
import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

export const FormField = ({ label, htmlFor, hint, error, children }: FormFieldProps) => (
  <label className="space-y-1.5" htmlFor={htmlFor}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-xs font-medium text-danger">{error}</p>}
  </label>
);

export const helperInputClass = clsx(
  "form-input",
  "placeholder:text-slate-400 focus:ring-2 focus:ring-brand/30 focus:border-brand",
);


