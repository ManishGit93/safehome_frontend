export default function Home() {
  return (
    <section className="rounded-xl bg-white p-10 shadow-sm">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-brand">SafeHome Dashboard</p>
        <h1 className="text-4xl font-semibold text-slate-900">Safety built on consent and clarity.</h1>
        <p className="text-lg text-slate-600">
          SafeHome lets families stay connected with transparent consent, configurable retention, and full control over
          data export or deletion. Parents gain real-time visibility only after their child approves each link request.
        </p>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { title: "Explicit Consent", text: "Children see, approve, and revoke parent access anytime." },
          { title: "Location Tracking", text: "Parents view live routes plus past 24h movement at a glance." },
          { title: "Privacy Toolkit", text: "Export, delete, retention cleanup, and audit logs for accountability." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-brand">{item.title}</p>
            <p className="text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
