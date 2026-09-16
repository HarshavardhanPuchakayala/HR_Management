import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  LuUsers,
  LuUserCheck,
  LuCalendarClock,
  LuClipboardCheck,
  LuBanknote,
  LuStar,
} from "react-icons/lu";
import { getDashboard } from "../api/dashboard.js";
import StatBlock from "../components/Statblock.jsx";
import { Alert } from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) =>
        setError(
          err.response?.data?.message || "Failed to load dashboard data."
        )
      );
  }, []);

  useEffect(() => {
    if (!data) return;

    // gsap.context scopes the tweens and reverts them fully on cleanup,
    // so a StrictMode re-run starts from a clean slate instead of
    // stacking tweens that leave elements stuck at opacity 0.
    const ctx = gsap.context(() => {
      pageEnter({
        header: headerRef.current,
        stagger: gridRef.current?.querySelectorAll(".stat-block"),
      });
    }, rootRef);

    return () => ctx.revert();
  }, [data]);

  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <div ref={headerRef}>
        <h1 className="text-2xl font-semibold">Good to see you</h1>
        <p className="mt-1 text-slate">
          Here's where the company stands today.
        </p>
      </div>

      <div
        ref={gridRef}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatBlock
          label="Total Employees"
          value={data.totalEmployees}
          icon={LuUsers}
          tone="ink"
        />
        <StatBlock
          label="Active Employees"
          value={data.activeEmployees}
          icon={LuUserCheck}
          tone="mint"
        />
        <StatBlock
          label="Pending Leave Requests"
          value={data.pendingLeaves}
          icon={LuCalendarClock}
          tone="amber"
        />
        <StatBlock
          label="Today's Attendance"
          value={data.todayAttendance}
          icon={LuClipboardCheck}
          tone="coral"
        />
        <StatBlock
          label="Payroll Runs"
          value={data.payrollRuns}
          icon={LuBanknote}
          tone="ink"
        />
        <StatBlock
          label="Reviews Awaiting Acknowledgement"
          value={data.pendingReviews}
          icon={LuStar}
          tone="mint"
        />
      </div>
    </div>
  );
}