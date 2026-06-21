"use client";

import { useEffect, useMemo, useState } from "react";

type ApprovalItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  change: {
    changeType: string;
    fact: {
      type: string;
      title: string;
      value: string;
      source?: string;
      confidence: number;
    };
    recommendation: string;
  };
  createdAt: string;
  reviewedAt?: string;
};

export default function MemoryReviewPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    setLoading(true);
    const res = await fetch("/api/memory-learning/queue", { cache: "no-store" });
    const data = await res.json();
    setItems(data.approvalQueue ?? []);
    setLoading(false);
  }

  async function review(id: string, status: "approved" | "rejected") {
    const res = await fetch("/api/memory-learning/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to review memory item");
      return;
    }

    await loadQueue();
  }

  useEffect(() => {
    loadQueue();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
    };
  }, [items]);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Cipher Phase 1B</p>
          <h1 style={styles.title}>Memory Review Center</h1>
          <p style={styles.subtitle}>
            Review, approve, or reject extracted memories before they become permanent Cipher knowledge.
          </p>
        </div>
        <button style={styles.refreshButton} onClick={loadQueue}>
          Refresh
        </button>
      </section>

      <section style={styles.statsGrid}>
        <Stat label="Total" value={stats.total} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Approved" value={stats.approved} />
        <Stat label="Rejected" value={stats.rejected} />
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>All Memory Items</h2>
        <p style={styles.panelText}>
          Pending items show approve/reject buttons. Approved and rejected items are shown as history.
        </p>

        {loading ? (
          <div style={styles.empty}>Loading memory queue...</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>No memory approvals found.</div>
        ) : (
          <div style={styles.list}>
            {items.map((item) => (
              <article key={item.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.badgeRow}>
                      <span style={styles.typeBadge}>{item.change.fact.type}</span>
                      <span style={getStatusStyle(item.status)}>{item.status}</span>
                    </div>
                    <h3 style={styles.cardTitle}>{item.change.fact.title}</h3>
                  </div>
                  <div style={styles.confidence}>
                    {Math.round(item.change.fact.confidence * 100)}%
                  </div>
                </div>

                <p style={styles.memoryValue}>{item.change.fact.value}</p>

                <div style={styles.meta}>
                  <span>Source: {item.change.fact.source ?? "unknown"}</span>
                  <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
                </div>

                {item.status === "pending" && (
                  <div style={styles.actions}>
                    <button
                      style={styles.approveButton}
                      onClick={() => review(item.id, "approved")}
                    >
                      Approve Memory
                    </button>
                    <button
                      style={styles.rejectButton}
                      onClick={() => review(item.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function getStatusStyle(status: ApprovalItem["status"]) {
  if (status === "approved") return { ...styles.statusBadge, ...styles.approved };
  if (status === "rejected") return { ...styles.statusBadge, ...styles.rejected };
  return { ...styles.statusBadge, ...styles.pending };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background:
      "radial-gradient(circle at top left, rgba(124,58,237,.28), transparent 32%), linear-gradient(135deg, #050816 0%, #0f172a 45%, #111827 100%)",
    color: "#f8fafc",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  hero: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "center",
  },
  eyebrow: {
    margin: 0,
    color: "#a78bfa",
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  title: {
    margin: "8px 0",
    fontSize: 46,
    lineHeight: 1,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    margin: 0,
    maxWidth: 690,
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 1.6,
  },
  refreshButton: {
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.1)",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
  statsGrid: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  statCard: {
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(15,23,42,.72)",
    backdropFilter: "blur(16px)",
    borderRadius: 22,
    padding: 22,
  },
  statValue: {
    fontSize: 34,
    fontWeight: 800,
  },
  statLabel: {
    color: "#94a3b8",
    marginTop: 4,
  },
  panel: {
    maxWidth: 1180,
    margin: "0 auto",
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(2,6,23,.58)",
    backdropFilter: "blur(18px)",
    borderRadius: 28,
    padding: 24,
  },
  panelTitle: {
    margin: 0,
    fontSize: 24,
  },
  panelText: {
    margin: "6px 0 18px",
    color: "#94a3b8",
  },
  list: {
    display: "grid",
    gap: 16,
  },
  card: {
    border: "1px solid rgba(255,255,255,.12)",
    background:
      "linear-gradient(180deg, rgba(30,41,59,.82), rgba(15,23,42,.82))",
    borderRadius: 22,
    padding: 20,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  typeBadge: {
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: "rgba(124,58,237,.2)",
    color: "#ddd6fe",
    textTransform: "uppercase",
  },
  statusBadge: {
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  pending: {
    background: "rgba(245,158,11,.18)",
    color: "#fde68a",
  },
  approved: {
    background: "rgba(34,197,94,.18)",
    color: "#bbf7d0",
  },
  rejected: {
    background: "rgba(239,68,68,.18)",
    color: "#fecaca",
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
  },
  confidence: {
    minWidth: 64,
    textAlign: "center",
    borderRadius: 16,
    padding: "10px 12px",
    background: "rgba(255,255,255,.08)",
    color: "#e0e7ff",
    fontWeight: 800,
  },
  memoryValue: {
    color: "#e2e8f0",
    fontSize: 16,
    lineHeight: 1.7,
    margin: "14px 0",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    color: "#94a3b8",
    fontSize: 13,
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },
  approveButton: {
    border: 0,
    borderRadius: 14,
    padding: "11px 16px",
    cursor: "pointer",
    color: "#052e16",
    background: "linear-gradient(135deg, #86efac, #22c55e)",
    fontWeight: 900,
  },
  rejectButton: {
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 14,
    padding: "11px 16px",
    cursor: "pointer",
    color: "#fecaca",
    background: "rgba(239,68,68,.12)",
    fontWeight: 800,
  },
  empty: {
    padding: 32,
    textAlign: "center",
    color: "#94a3b8",
    border: "1px dashed rgba(255,255,255,.16)",
    borderRadius: 20,
  },
};