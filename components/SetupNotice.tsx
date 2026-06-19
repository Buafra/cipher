import { Card } from "@/components/Card";

/**
 * Shown when a server component can't reach the database. Instead of a blank
 * "Application error" screen, this explains the likely causes in plain terms.
 * The raw error is included so the actual reason (e.g. a missing table) is
 * visible right on the page.
 */
export function SetupNotice({ error }: { error: string }) {
  return (
    <Card className="border-l-2 border-l-brass">
      <h2 className="font-display text-xl font-light text-paper">
        Cipher can&rsquo;t read the database yet
      </h2>
      <p className="mt-2 text-sm text-paper-dim">
        The app is running, but a database query failed. The usual reasons, in
        order of likelihood:
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-paper-dim">
        <li>
          <span className="text-paper">The schema hasn&rsquo;t been run.</span>{" "}
          If the error below mentions a relation or table that{" "}
          <em>does not exist</em>, open Supabase &rarr; <strong>SQL Editor</strong>,
          paste all of <code className="text-brass">supabase/schema.sql</code>, and run it.
        </li>
        <li>
          <span className="text-paper">Env vars weren&rsquo;t loaded.</span>{" "}
          Next.js reads <code className="text-brass">.env.local</code> only at
          startup &mdash; if you edited it while running, stop the server
          (Ctrl&#8209;C) and run <code className="text-brass">npm run dev</code> again.
        </li>
        <li>
          <span className="text-paper">Wrong key.</span> {" "}
          <code className="text-brass">SUPABASE_SERVICE_ROLE_KEY</code> must be a
          secret / service_role key, not the publishable / anon one.
        </li>
      </ol>
      <p className="mt-4 text-xs text-paper-faint">
        Full error (also printed in the terminal running the dev server):
      </p>
      <pre className="mt-1 overflow-x-auto rounded-md bg-ink p-3 text-xs text-paper-dim">
        {error}
      </pre>
    </Card>
  );
}
