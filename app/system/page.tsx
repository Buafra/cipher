import { Eyebrow, Card } from "@/components/Card";

export default function SystemPage() {
  const services = [
    {
      name: "Claude",
      ok: !!process.env.ANTHROPIC_API_KEY,
    },
    {
      name: "Tavily",
      ok: !!process.env.TAVILY_API_KEY,
    },
    {
      name: "Supabase URL",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    {
      name: "Supabase Service Role",
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  ];

  const configuredCount = services.filter((s) => s.ok).length;

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>System</Eyebrow>

        <h1 className="font-display text-2xl font-light text-paper">
          Cipher System Status
        </h1>

        <p className="mt-1 text-sm text-paper-dim">
          Read-only environment configuration check.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-paper-dim">Overall Status</span>

          <span
            className={
              configuredCount === services.length
                ? "text-green-400"
                : "text-yellow-400"
            }
          >
            {configuredCount}/{services.length} Services Configured
          </span>
        </div>

        <div className="mb-4 border-b border-white/10 pb-3 text-sm text-paper-dim">
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>Cipher Version: 0.1.0</p>
        </div>

        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between"
            >
              <span className="text-paper">{service.name}</span>

              <span
                className={
                  service.ok
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {service.ok ? "Configured ✅" : "Missing ❌"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}