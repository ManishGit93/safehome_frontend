"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { ConsentModal } from "../privacy/ConsentModal";

const linksByRole = {
  child: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/links", label: "Link Requests" },
    { href: "/my-privacy", label: "My Privacy" },
  ],
  parent: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/links/manage", label: "Manage Links" },
    { href: "/privacy", label: "Privacy" },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/privacy", label: "Privacy" },
  ],
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, refreshUser } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    await refreshUser();
  };

  const navLinks = user ? linksByRole[user.role] ?? [] : [];

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-white/70 bg-white/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-brand-dark">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-brand">SH</span>
            SafeHome
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1 transition ${
                  pathname === link.href ? "bg-brand/15 text-brand-dark" : "text-slate-600 hover:text-brand"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link className="text-slate-600 hover:text-brand" href="/login">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
                >
                  Create account
                </Link>
              </>
            )}
            {user && (
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 pb-14 pt-6">
        {user && (
          <aside className="sticky top-6 hidden h-fit w-56 flex-col gap-6 rounded-2xl bg-white/80 p-5 shadow-soft md:flex">
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="text-lg font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs uppercase tracking-widest text-brand">{user.role}</p>
            </div>
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                    pathname === link.href ? "bg-brand/15 text-brand-dark" : "text-slate-500 hover:text-brand"
                  }`}
                >
                  {link.label}
                  <span aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <ConsentModal />
    </div>
  );
};


