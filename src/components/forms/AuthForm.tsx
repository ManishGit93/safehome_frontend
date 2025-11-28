"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FormField, helperInputClass } from "../ui/form-field";

interface AuthFormProps {
  mode: "login" | "signup";
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "parent" });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload = mode === "signup" ? form : { email: form.email, password: form.password };
      await apiFetch(endpoint, { method: "POST", body: payload });
      await refreshUser();
      setStatus(isSignup ? "Account created! Redirecting…" : "Success! Redirecting…");
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl">{isSignup ? "Create your SafeHome account" : "Welcome back"}</CardTitle>
        <p className="text-sm text-slate-500">
          {isSignup ? "Invite trusted parents or keep tabs on linked children." : "Sign in to continue safeguarding."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <FormField label="Full name">
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Sahana Patel"
                className={helperInputClass}
              />
            </FormField>
          )}

          <FormField label="Email address">
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="you@example.com"
              className={helperInputClass}
            />
          </FormField>

          <FormField label="Password">
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Strong & memorable"
              className={helperInputClass}
            />
          </FormField>

          {isSignup && (
            <FormField label="I am signing up as">
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                className="form-select"
              >
                <option value="parent">Parent / Guardian</option>
                <option value="child">Child</option>
              </select>
            </FormField>
          )}

          {error && <p className="rounded-xl bg-danger-light/80 px-3 py-2 text-sm text-danger">{error}</p>}
          {status && <p className="rounded-xl bg-brand-muted px-3 py-2 text-sm text-brand-dark">{status}</p>}

          <Button type="submit" className="w-full" isLoading={loading} size="lg">
            {isSignup ? "Create account" : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {isSignup ? "Already have an account?" : "New to SafeHome?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-brand">
            {isSignup ? "Log in" : "Create one"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};


