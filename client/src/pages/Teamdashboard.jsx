import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuUsers, LuArrowRight, LuMail } from "react-icons/lu";
import { getEmployees } from "../api/employees.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  PageHeader,
  Alert,
  EmptyState,
} from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

export default function TeamDashboard() {
  const { user } = useAuth();

  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");

        const data = await getEmployees();

        const all = Array.isArray(data) ? data : [];

        /*
         * UI-side filter only — the backend still owns authorization
         * for anything this page links out to.
         */
        const reports = all.filter((employee) => {
          if (!employee.managerId) return false;

          const managerId =
            typeof employee.managerId === "object"
              ? employee.managerId._id
              : employee.managerId;

          return (
            managerId?.toString() === user?.employeeId?.toString() &&
            employee.status === "active"
          );
        });

        setTeam(reports);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load your team."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.employeeId]);

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger: listRef.current?.querySelectorAll(".team-card"),
    });
  }, [loading]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading your team...
      </div>
    );
  }

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="Your Team"
          subtitle={
            team.length > 0
              ? `${team.length} ${
                  team.length === 1 ? "person reports" : "people report"
                } to you.`
              : "No direct reports on file."
          }
          action={
            <Link to="/team/leave-requests" className="btn-secondary">
              Team leave
              <LuArrowRight size={15} />
            </Link>
          }
        />
      </div>

      <Alert tone="error">{error}</Alert>

      <div ref={listRef}>
        {team.length === 0 ? (
          <EmptyState
            icon={LuUsers}
            title="No direct reports"
            hint="Ask an administrator to assign people to you as their manager."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <article key={member._id} className="team-card card p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display font-semibold text-white">
                    {(member.name || "?").slice(0, 1).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">
                      {member.name}
                    </p>
                    <p className="truncate text-sm text-slate">
                      {member.jobTitle || "No job title"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-sm text-slate">
                    {member.department || "No department"}
                  </p>

                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coralDark"
                    >
                      <LuMail size={14} />
                      {member.email}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}