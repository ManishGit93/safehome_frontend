"use client";

import Link from "next/link";
import { ChildDashboard } from "../../components/dashboard/ChildDashboard";
import { ParentDashboard } from "../../components/dashboard/ParentDashboard";
import { useAuth } from "../../hooks/useAuth";

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-sm text-slate-500">Checking your session…</p>;
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-600">
          Please <Link href="/login">log in</Link> to access the dashboard.
        </p>
      </div>
    );
  }

  if (user.role === "parent") {
    return <ParentDashboard />;
  }

  if (user.role === "child") {
    return <ChildDashboard />;
  }

  return <p className="text-sm text-slate-600">Admin view coming soon.</p>;
};

export default DashboardPage;


