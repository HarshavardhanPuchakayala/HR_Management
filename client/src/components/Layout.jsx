import { useEffect, useLayoutEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import gsap from "gsap";
import {
  LuLayoutDashboard,
  LuUser,
  LuClock,
  LuCalendarDays,
  LuWallet,
  LuStar,
  LuUserPlus,
  LuUserMinus,
  LuFolderOpen,
  LuBell,
  LuScrollText,
  LuUsers,
  LuShieldCheck,
  LuSparkles,
  LuLogOut,
} from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";
import AssistantWidget from "./AssistantWidget.jsx";
import { movePill, prefersReducedMotion } from "../lib/Motion.js";

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) =>
      `nav-item${
        isActive ? " active" : ""
      } relative z-10 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium
       transition-colors duration-150 ${
         isActive ? "text-ink" : "text-white/60 hover:text-white"
       }`
    }
  >
    <Icon className="shrink-0" size={18} />
    <span className="truncate">{label}</span>
  </NavLink>
);

const NavSection = ({ title, children }) => (
  <div className="mb-1">
    {title && (
      <p className="px-3.5 pt-4 pb-1.5 text-[11px] font-semibold tracking-wide text-white/35">
        {title}
      </p>
    )}
    <div className="flex flex-col gap-0.5">{children}</div>
  </div>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const sidebarRef = useRef(null);
  const navContainerRef = useRef(null);
  const pillRef = useRef(null);
  const mainRef = useRef(null);
  const hasPositionedPill = useRef(false);

  const role = user?.role;
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  /*
   * Entrance sequence. Uses fromTo, not from: React 18 StrictMode runs
   * effects twice in dev, and gsap.from() on a second run treats the
   * current mid-tween opacity as the destination, leaving nav items
   * faded out permanently.
   */
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set(sidebarRef.current, { x: 0, opacity: 1 });
        gsap.set(".nav-item", { opacity: 1, x: 0 });
        return;
      }

      gsap.fromTo(
        sidebarRef.current,
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      gsap.fromTo(
        ".nav-item",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.03,
          delay: 0.15,
          ease: "power2.out",
          clearProps: "opacity,transform",
        }
      );
    }, sidebarRef);

    return () => ctx.revert();
  }, []);

  /*
   * Slide the active pill behind the current nav item.
   *
   * useLayoutEffect, not useEffect: the pill must be measured after the
   * DOM updates but before paint, otherwise it visibly jumps.
   *
   * offsetTop/offsetHeight, NOT getBoundingClientRect: the nav is a
   * scrollable container (overflow-y-auto). getBoundingClientRect returns
   * viewport coordinates, so once the nav was scrolled at all, the pill
   * landed on the wrong item -- which is the sidebar bug you hit. offsetTop
   * is measured against the positioned nav element and is scroll-independent.
   */
  useLayoutEffect(() => {
    const container = navContainerRef.current;
    const pill = pillRef.current;

    if (!container || !pill) return;

    const active = container.querySelector(".nav-item.active");

    if (!active) {
      gsap.to(pill, { opacity: 0, duration: 0.15 });
      hasPositionedPill.current = false;
      return;
    }

    const box = { top: active.offsetTop, height: active.offsetHeight };

    // First placement snaps into position (no slide-in from y=0 on load);
    // later ones slide. movePill itself also snaps under reduced motion.
    const snap = !hasPositionedPill.current;

    movePill(pill, box, { snap });

    hasPositionedPill.current = true;
  }, [location.pathname, role]);

  useEffect(() => {
    if (!mainRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(mainRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        clearProps: "opacity,transform",
      }
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-ink"
      >
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral">
            <LuSparkles className="text-white" size={18} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none text-white">
              PeopleFlow
            </p>
            <p className="mt-1 text-[11px] text-white/40">HR, done well</p>
          </div>
        </div>

        <nav
          ref={navContainerRef}
          className="relative flex-1 overflow-y-auto px-3 pb-4"
        >
          <div
            ref={pillRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 right-3 top-0 z-0 rounded-xl bg-white opacity-0"
            style={{ height: 0 }}
          />

          <NavSection>
            <NavItem to="/" icon={LuLayoutDashboard} label="Dashboard" />
            <NavItem to="/profile" icon={LuUser} label="Profile" />
            <NavItem to="/attendance" icon={LuClock} label="Attendance" />
            <NavItem
              to="/leave-requests"
              icon={LuCalendarDays}
              label="Leave Requests"
            />
            <NavItem
              to="/leave-balances"
              icon={LuCalendarDays}
              label="Leave Balances"
            />
            <NavItem to="/payroll" icon={LuWallet} label="Payroll" />
            <NavItem
              to="/performance-reviews"
              icon={LuStar}
              label="Performance Reviews"
            />
            <NavItem to="/documents" icon={LuFolderOpen} label="Documents" />
            <NavItem to="/notifications" icon={LuBell} label="Notifications" />
          </NavSection>

          {isAdmin && (
            <NavSection title="Onboarding">
              <NavItem to="/onboarding" icon={LuUserPlus} label="Onboarding" />
              <NavItem
                to="/offboarding"
                icon={LuUserMinus}
                label="Offboarding"
              />
            </NavSection>
          )}

          {isManager && (
            <NavSection title="Team">
              <NavItem to="/team" icon={LuUsers} label="Team Dashboard" />
              <NavItem
                to="/team/leave-requests"
                icon={LuCalendarDays}
                label="Team Leave"
              />
            </NavSection>
          )}

          {(isAdmin || isManager) && (
            <NavSection title="Oversight">
              <NavItem
                to="/attendance/oversight"
                icon={LuShieldCheck}
                label="Attendance Oversight"
              />
            </NavSection>
          )}

          {isAdmin && (
            <NavSection title="Admin">
              <NavItem to="/admin" icon={LuShieldCheck} label="Admin Dashboard" />
              <NavItem to="/admin/employees" icon={LuUsers} label="Employees" />
              <NavItem
                to="/admin/leave-requests"
                icon={LuCalendarDays}
                label="Leave Requests"
              />
              <NavItem
                to="/admin/leave-balances"
                icon={LuCalendarDays}
                label="Leave Balances"
              />
              <NavItem to="/audit-logs" icon={LuScrollText} label="Audit Logs" />
            </NavSection>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {(user?.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "Signed in"}
              </p>
              <p className="truncate text-[11px] capitalize text-white/40">
                {role || ""}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LuLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 pl-64">
        <main ref={mainRef} className="mx-auto max-w-6xl px-8 py-8 pb-28">
          <Outlet />
        </main>
      </div>

      {/* Reachable from every page instead of being a nav destination */}
      <AssistantWidget />
    </div>
  );
};

export default Layout;