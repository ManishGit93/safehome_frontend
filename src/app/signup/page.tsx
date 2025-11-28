"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "../../components/forms/AuthForm";
import { useAuth } from "../../hooks/useAuth";

const SignupPage = () => {
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
          <p className="text-sm uppercase tracking-[0.4em] text-brand">Get started</p>
          <h2 className="text-4xl font-semibold text-slate-900">Invite trusted family members in minutes</h2>
          <p>
            SafeHome keeps a transparent audit of every link request. Children approve each parent, control consent, and
            can revoke access instantly.
          </p>
        </motion.div>
        <AuthForm mode="signup" />
      </div>
    </section>
  );
};

export default SignupPage;


