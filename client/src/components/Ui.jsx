import { LuCircleAlert, LuCircleCheck, LuInbox } from "react-icons/lu";

/** Page title + supporting line. Every page opens with this. */
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-slate">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/** Inline error / success banner. tone: "error" | "success" */
export const Alert = ({ tone = "error", children }) => {
  if (!children) return null;

  const isError = tone === "error";

  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
        isError
          ? "bg-coral/10 text-coralDark"
          : "bg-mint/15 text-mintDark"
      }`}
    >
      {isError ? (
        <LuCircleAlert className="mt-0.5 shrink-0" size={16} />
      ) : (
        <LuCircleCheck className="mt-0.5 shrink-0" size={16} />
      )}
      <span>{children}</span>
    </div>
  );
};

/**
 * Status chip. Colors encode meaning: mint = resolved/good,
 * amber = waiting on someone, coral = stopped/rejected, slate = inactive.
 */
const STATUS_TONES = {
  approved: "bg-mint/15 text-mintDark",
  active: "bg-mint/15 text-mintDark",
  completed: "bg-mint/15 text-mintDark",
  acknowledged: "bg-mint/15 text-mintDark",
  present: "bg-mint/15 text-mintDark",
  paid: "bg-mint/15 text-mintDark",

  pending: "bg-amber/20 text-amberDark",
  draft: "bg-amber/20 text-amberDark",
  in_progress: "bg-amber/20 text-amberDark",
  initiated: "bg-amber/20 text-amberDark",
  submitted: "bg-amber/20 text-amberDark",
  calculated: "bg-amber/20 text-amberDark",

  rejected: "bg-coral/15 text-coralDark",
  failed: "bg-coral/15 text-coralDark",
  absent: "bg-coral/15 text-coralDark",

  cancelled: "bg-slate/15 text-slate",
  inactive: "bg-slate/15 text-slate",
  skipped: "bg-slate/15 text-slate",
};

export const StatusPill = ({ status }) => {
  if (!status) return null;

  const key = String(status).toLowerCase();

  return (
    <span className={`pill ${STATUS_TONES[key] || "bg-slate/15 text-slate"}`}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
};

/** Empty screens are an invitation to act, not a shrug. */
export const EmptyState = ({ icon: Icon = LuInbox, title, hint }) => (
  <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-line bg-surface px-6 py-14 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-slate">
      <Icon size={19} />
    </div>
    <p className="mt-3 font-medium text-ink">{title}</p>
    {hint && <p className="mt-1 max-w-xs text-sm text-slate">{hint}</p>}
  </div>
);

/** Content card with optional title. */
export const Card = ({ title, description, children, className = "" }) => (
  <section className={`card p-6 ${className}`}>
    {title && (
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate">{description}</p>
        )}
      </div>
    )}
    {children}
  </section>
);

/** Table shell — keeps every data table on the app identical. */
export const Table = ({ head, children }) => (
  <div className="overflow-x-auto rounded-xl border border-line">
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="bg-canvas">
          {head.map((cell) => (
            <th
              key={cell}
              className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate"
            >
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
);

export const Field = ({ label, htmlFor, error, children }) => (
  <div>
    <label htmlFor={htmlFor} className="field-label">
      {label}
    </label>
    {children}
    {error && <p className="mt-1.5 text-sm text-coralDark">{error}</p>}
  </div>
);