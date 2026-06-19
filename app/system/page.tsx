import { Eyebrow, Card } from "@/components/Card";

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>System</Eyebrow>
        <h1 className="font-display text-2xl font-light text-paper">
          Cipher System Status
        </h1>
        <p className="mt-1 text-sm text-paper-dim">
          Read-only status page for Cipher services. Scaffolded only.
        </p>
      </div>

      <Card>
        <div className="space-y-3 text-sm text-paper-dim">
          <p>Claude: Not checked</p>
          <p>Gemini: Not checked</p>
          <p>Tavily: Not checked</p>
          <p>Supabase: Not checked</p>
          <p>Memory: Not checked</p>
        </div>
      </Card>
    </div>
  );
}