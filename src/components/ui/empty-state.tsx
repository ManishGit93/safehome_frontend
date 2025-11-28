import type { ReactNode } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <Card className="text-center">
    <CardContent className="space-y-3 py-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
        {icon ?? "😊"}
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action && (
        <Button variant="primary" onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);


