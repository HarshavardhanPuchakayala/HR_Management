import { useEffect, useState } from "react";
import { getAuditLogs } from "../api/auditLogs.js";

export default function AuditLogs() {
  const [data, setData] = useState({
    logs: [],
    total: 0,
  });

  const load = async () => {
    const result = await getAuditLogs();
    setData(result);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <div>
      <h1>Audit Logs</h1>

      <p>Total: {data.total}</p>

      {data.logs.map((log) => (
        <div key={log._id}>
          <strong>{log.action}</strong>

          <p>
            {log.entityType}
            {log.entityId ? ` — ${log.entityId}` : ""}
          </p>

          <p>
            User: {log.actorId?.email || "Unknown"}
          </p>

          <p>
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}