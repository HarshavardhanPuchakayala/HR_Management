import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  LuUsers,
  LuCalendarDays,
  LuScrollText,
  LuUserPlus,
  LuArrowRight,
  LuShieldCheck,
} from "react-icons/lu";
import { getDashboard } from "../api/dashboard.js";
import StatBlock from "../components/Statblock.jsx";
import { PageHeader, Alert } from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

const SHORTCUTS = [
  {
    to: "/admin/employees",
    icon: LuUsers,
    title: "Employees",
    hint: "Add people or update their details",
  },
  {
    to: "/admin/leave-requests",
    icon: LuCalendarDays,
    title: "Leave requests",
    hint: "Decide on company-wide leave",
  },
  {
    to: "/admin/leave-balances",
    icon: LuShieldCheck,
    title: "Leave balances",
    hint: "Set allotments for the cycle",
  },
  {
    to: "/onboarding",
    icon: LuUserPlus,
    title: "Onboarding",
    hint: "Run new hires through a checklist",
  },
  {
    to: "/audit-logs",
    icon: LuScrollText,
    title: "Audit logs",
    hint: "See who changed what",
  },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const headerRef = useRef(null);
  const bodyRef = useRef(null);

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

    // Scoped + reverted on cleanup so a StrictMode double-invoke can't
    // leave the stat blocks and shortcuts stuck mid-fade.
    const ctx = gsap.context(() => {
      pageEnter({
        header: headerRef.current,
        stagger: bodyRef.current?.querySelectorAll(".stat-block, .shortcut"),
      });
    }, bodyRef);

    return () => ctx.revert();
  }, [data]);

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="Admin Dashboard"
          subtitle="The whole company at a glance, and the places you act from."
        />
      </div>

      <Alert tone="error">{error}</Alert>

      <div ref={bodyRef}>
        {data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock
              label="Employees"
              value={data.totalEmployees}
              icon={LuUsers}
              tone="ink"
            />
            <StatBlock
              label="Active"
              value={data.activeEmployees}
              icon={LuUsers}
              tone="mint"
            />
            <StatBlock
              label="Leave pending"
              value={data.pendingLeaves}
              icon={LuCalendarDays}
              tone="amber"
            />
            <StatBlock
              label="In today"
              value={data.todayAttendance}
              icon={LuShieldCheck}
              tone="coral"
            />
          </div>
        )}

        <h2 className="mb-4 mt-8 text-lg font-semibold">Jump to</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.to}
              to={shortcut.to}
              className="shortcut card group flex items-center gap-4 p-5 transition-colors hover:border-coral"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink">
                <shortcut.icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">{shortcut.title}</p>
                <p className="mt-0.5 text-sm text-slate">
                  {shortcut.hint}
                </p>
              </div>

              <LuArrowRight
                size={16}
                className="shrink-0 text-slate transition-colors group-hover:text-coral"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}