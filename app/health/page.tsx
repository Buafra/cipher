import { Eyebrow, Card } from "@/components/Card";

export default function HealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Phase 4</Eyebrow>
        <h1 className="font-display text-2xl font-light text-paper">Health</h1>
        <p className="mt-1 text-sm text-paper-dim">
          Logged metrics and gentle anomaly nudges. Scaffolded, not yet wired.
        </p>
      </div>
      <Card>
        <p className="text-paper-dim">To build this phase:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-paper-dim">
          <li>Decide your input: manual logging here, or a sync from a wearable export.</li>
          <li>Write to the <code className="text-brass">health_logs</code> table (table already exists).</li>
          <li>Add a baseline check in the trigger job's health stub to alert on meaningful deviations.</li>
          <li>Surface recent trends on this screen and inside the morning briefing context.</li>
        </ol>
      </Card>
    </div>
  );
}
