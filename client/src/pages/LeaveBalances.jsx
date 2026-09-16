import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LuCalendarDays } from "react-icons/lu";
import { getMyLeaveBalances } from "../api/leaveBalances.js";
import { PageHeader, Alert, EmptyState } from "../components/Ui.jsx";

const LEAVE_TYPES = ["sick", "casual", "vacation", "other"];

const TYPE_COLORS = {
  sick: "bg-coral",
  casual: "bg-mint",
  vacation: "bg-amber",
  other: "bg-ink",
};

const LeaveBalances = () => {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const gridRef = useRef(null);

  useEffect(() => {
    const loadBalances = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyLeaveBalances(year);

        setBalances(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load leave balances"
        );
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [year]);

  // Bars grow to their real proportion once data lands.
  useEffect(() => {
    if (loading || !gridRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".balance-card", {
        opacity: 0,
        y: 14,
        duration: 0.45,
        stagger: 0.07,
        ease: "power3.out",
      });

      gsap.from(".balance-bar", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.8,
        stagger: 0.07,
        delay: 0.15,
        ease: "power3.out",
      });
    }, gridRef);

    return () => ctx.revert();
  }, [loading, balances]);

  return (
    <div>
      <PageHeader
        title="Leave Balances"
        subtitle="How much time off you have left this year."
        action={
          <select
            aria-label="Leave year"
            className="field-input w-auto"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(
              (optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              )
            )}
          </select>
        }
      />

      <Alert tone="error">{error}</Alert>

      {loading && <p className="text-slate">Loading leave balances...</p>}

      {!loading && !error && balances.length === 0 && (
        <EmptyState
          icon={LuCalendarDays}
          title={`No balances set for ${year}`}
          hint="Your administrator initializes leave balances at the start of each cycle."
        />
      )}

      {!loading && !error && balances.length > 0 && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {LEAVE_TYPES.map((leaveType) => {
            const balance = balances.find(
              (item) => item.leaveType === leaveType
            );

            if (!balance) {
              return (
                <div
                  key={leaveType}
                  className="balance-card card p-5 opacity-60"
                >
                  <p className="font-display font-semibold capitalize">
                    {leaveType}
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    Not set for {year}
                  </p>
                </div>
              );
            }

            const total = balance.totalAllotted + balance.carriedOver;
            const available = total - balance.used;
            const usedPercent = total > 0 ? (balance.used / total) * 100 : 0;

            return (
              <div key={balance._id} className="balance-card card p-5">
                <div className="flex items-baseline justify-between">
                  <p className="font-display font-semibold capitalize">
                    {balance.leaveType}
                  </p>
                  <p className="font-display text-2xl font-semibold">
                    {available}
                    <span className="ml-1 text-sm font-normal text-slate">
                      / {total} days left
                    </span>
                  </p>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`balance-bar h-full rounded-full ${
                      TYPE_COLORS[balance.leaveType] || "bg-ink"
                    }`}
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>

                <div className="mt-3 flex gap-5 text-xs text-slate">
                  <span>Allotted {balance.totalAllotted}</span>
                  <span>Carried over {balance.carriedOver}</span>
                  <span>Used {balance.used}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveBalances;