"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../ui/modal";

export const ConsentModal = () => {
  const { user, refreshUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === "child" && !user.consentGiven) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [user]);

  const handleConsent = async (consentGiven: boolean) => {
    setBusy(true);
    try {
      await apiFetch("/me/consent", {
        method: "POST",
        body: { consentGiven, consentTextVersion: "v1" },
      });
      await refreshUser();
      if (!consentGiven) {
        await apiFetch("/auth/logout", { method: "POST" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      title="Location consent required"
      description="SafeHome only tracks your background location with your explicit, revocable consent."
      primaryAction={{
        label: "I agree",
        onClick: () => handleConsent(true),
        loading: busy,
      }}
      secondaryAction={{
        label: "No thanks (log out)",
        onClick: () => handleConsent(false),
      }}
    >
      <ul className="list-disc space-y-1 pl-5">
        <li>Only linked parents can see your live and recent locations.</li>
        <li>History is trimmed after ~30 days by default.</li>
        <li>You can export or delete your data at any time.</li>
      </ul>
    </Modal>
  );
};


