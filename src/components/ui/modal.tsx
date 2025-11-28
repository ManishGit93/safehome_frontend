"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: ComponentProps<typeof Button>["variant"];
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: ComponentProps<typeof Button>["variant"];
  };
  children?: ReactNode;
}

export const Modal = ({
  isOpen,
  title,
  description,
  onClose,
  primaryAction,
  secondaryAction,
  children,
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
              </div>
              <div className="text-sm text-slate-600">{children}</div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                {secondaryAction && (
                  <Button variant="subtle" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </Button>
                )}
                {primaryAction && (
                  <Button
                    variant={primaryAction.variant ?? "primary"}
                    onClick={primaryAction.onClick}
                    isLoading={primaryAction.loading}
                  >
                    {primaryAction.label}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};


