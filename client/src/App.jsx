import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import Layout from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LeaveRequests from "./pages/LeaveRequests.jsx";
import LeaveBalances from "./pages/LeaveBalances.jsx";
import TeamLeaveRequests from "./pages/TeamLeaveRequests.jsx";
import AdminEmployees from "./pages/AdminEmployees.jsx";
import AdminLeaveRequests from "./pages/AdminLeaveRequests.jsx";
import AdminLeaveBalances from "./pages/AdminLeaveBalances.jsx";
import AttendanceOversight from "./pages/AttendanceOversight.jsx";
import PerformanceReviews from "./pages/PerformanceReviews.jsx";
import Payroll from "./pages/Payroll.jsx";
import Payslip from "./pages/Payslip.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Offboarding from "./pages/Offboarding.jsx";
import Documents from "./pages/Documents.jsx";
import Notifications from "./pages/Notifications.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

/* Previously inline stubs — now real pages */
import Profile from "./pages/Profile.jsx";
import Attendance from "./pages/Attendance.jsx";
import TeamDashboard from "./pages/Teamdashboard.jsx";
import AdminDashboard from "./pages/Admindashboard.jsx";
import NotAuthorized from "./pages/Notauthorized.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/not-authorized" element={<NotAuthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Core, any authenticated user */}
          <Route path="/" element={<Dashboard />} />
          {/*
            NOTE: /dashboard duplicates "/" intentionally, kept as an
            alias in case any links/nav reference it directly.
            Remove this route if it turns out to be unused.
          */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave-requests" element={<LeaveRequests />} />
          <Route path="/leave-balances" element={<LeaveBalances />} />
          {/* The assistant is now a floating widget mounted in Layout,
              reachable from every page, so it has no route of its own. */}
          <Route path="/notifications" element={<Notifications />} />

          {/*
            Performance Reviews — accessible to admin, manager, and
            employee. The page itself is responsible for showing the
            right view per role (submit vs. review vs. read own).
          */}
          <Route
            path="/performance-reviews"
            element={<PerformanceReviews />}
          />

          {/*
            Documents — every authenticated user can view/acknowledge
            their own documents. Documents.jsx pulls the current user
            from useAuth() internally; it does NOT take a user prop.
          */}
          <Route path="/documents" element={<Documents />} />

          {/*
            Payroll / Payslips — kept open to any authenticated user
            for now, since employees need to view their OWN payslips.
            Payroll.jsx must internally gate admin-only actions
            (e.g. "generate payroll for period") behind a role check,
            the same way other shared pages already separate
            role-specific UI within one component.
          */}
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payroll/:id/payslip" element={<Payslip />} />

          {/* Manager-only */}
          <Route element={<RoleRoute allowedRoles={["manager"]} />}>
            <Route path="/team" element={<TeamDashboard />} />
            <Route
              path="/team/leave-requests"
              element={<TeamLeaveRequests />}
            />
          </Route>

          {/* Manager + Admin */}
          <Route
            element={<RoleRoute allowedRoles={["manager", "admin"]} />}
          >
            <Route
              path="/attendance/oversight"
              element={<AttendanceOversight />}
            />
          </Route>

          {/* Admin-only */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<AdminEmployees />} />
            <Route
              path="/admin/leave-requests"
              element={<AdminLeaveRequests />}
            />
            <Route
              path="/admin/leave-balances"
              element={<AdminLeaveBalances />}
            />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/offboarding" element={<Offboarding />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}