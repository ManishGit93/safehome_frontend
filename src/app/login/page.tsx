"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "../../components/forms/AuthForm";
import { useAuth } from "../../hooks/useAuth";

const LoginPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  return (
    <section className="safehome-auth-bg rounded-3xl border border-white/60 p-6 shadow-card">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4 text-slate-700"
        >
          <p className="text-sm uppercase tracking-[0.4em] text-brand">SafeHome</p>
          <h2 className="text-4xl font-semibold text-slate-900">Your family safety dashboard</h2>
          <p>
            Monitor linked children, review consent, and follow live updates only after they have granted explicit access.
            We keep controls clear so trust stays intact.
          </p>
        </motion.div>
        <AuthForm mode="login" />
      </div>
    </section>
  );
};

export default LoginPage;


