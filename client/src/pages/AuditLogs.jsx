import { useEffect, useRef, useState } from "react";
import { LuScrollText } from "react-icons/lu";
import { getAuditLogs } from "../api/auditLogs.js";
import {
  PageHeader,
  Alert,
  EmptyState,
} from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

/** Action words are colored by what they do to data. */
const actionTone = (action = "") => {
  const value = action.toLowerCase();

  if (value.includes("delete") || value.includes("deactivate")) {
    return "bg-coral";
  }

  if (value.includes("create") || value.includes("approve")) {
    return "bg-mint";
  }

  if (value.includes("update") || value.includes("adjust")) {
    return "bg-amber";
  }

  return "bg-ink";
};

export default function AuditLogs() {
  const [data, setData] = useState({ logs: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headerRef = useRef(null);
  const listRef = useRef(null);

  const load = async () => {
    try {
      setError("");

      const result = await getAuditLogs();

      setData({
        logs: Array.isArray(result?.logs) ? result.logs : [],
        total: result?.total ?? 0,
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger: listRef.current?.querySelectorAll(".log-row"),
      staggerAmount: 0.03,
    });
  }, [loading]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading audit logs...
      </div>
    );
  }

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="Audit Logs"
          subtitle={`${data.total.toLocaleString()} recorded actions across PeopleFlow.`}
        />
      </div>

      <Alert tone="error">{error}</Alert>

      <div ref={listRef}>
        {data.logs.length === 0 ? (
          <EmptyState
            icon={LuScrollText}
            title="No activity recorded"
            hint="Actions taken in PeopleFlow are written here automatically."
          />
        ) : (
          // Timeline structure: these entries genuinely are a sequence in time
          <div className="relative border-l border-line pl-6">
            {data.logs.map((log) => (
              <div key={log._id} className="log-row relative pb-6 last:pb-0">
                <span
                  className={`absolute -left-[1.84rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-canvas ${actionTone(
                    log.action
                  )}`}
                />

                <div className="card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display font-semibold">
                      {log.action}
                    </p>
                    <p className="text-xs text-slate">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-1 text-sm text-slate">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId}` : ""}
                  </p>

                  <p className="mt-1.5 text-sm">
                    by {log.actorId?.email || "Unknown user"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}