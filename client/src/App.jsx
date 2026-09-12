
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
import Assistant from "./pages/Assistant.jsx";
import PerformanceReviews from "./pages/PerformanceReviews.jsx";
import Payroll from "./pages/Payroll.jsx";
import Payslip from "./pages/Payslip.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Offboarding from "./pages/Offboarding.jsx";
import Documents from "./pages/Documents.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Notifications from "./pages/Notifications.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

function Profile() {
  return <h1>Profile</h1>;
}

function Attendance() {
  return <h1>Attendance</h1>;
}

function TeamDashboard() {
  return <h1>Team Dashboard</h1>;
}

function AdminDashboard() {
  return <h1>Admin Dashboard</h1>;
}

function NotAuthorized() {
  return <h1>Not Authorized</h1>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/not-authorized"
        element={<NotAuthorized />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          <Route
            path="/leave-requests"
            element={<LeaveRequests />}
          />

          <Route
            path="/leave-balances"
            element={<LeaveBalances />}
          />

          {/* Performance Reviews
              Accessible to authenticated
              admin, manager, and employee users.
          */}
          <Route
            path="/performance-reviews"
            element={<PerformanceReviews />}
          />

          {/* Manager routes */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["manager"]}
              />
            }
          >
            <Route
              path="/team"
              element={<TeamDashboard />}
            />

            <Route
              path="/team/leave-requests"
              element={<TeamLeaveRequests />}
            />
          </Route>

          {/* Manager + Admin routes */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["manager", "admin"]}
              />
            }
          >
            <Route
              path="/attendance/oversight"
              element={<AttendanceOversight />}
            />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["admin"]}
              />
            }
          >
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/employees"
              element={<AdminEmployees />}
            />

            <Route
              path="/admin/leave-requests"
              element={<AdminLeaveRequests />}
            />

            <Route
              path="/admin/leave-balances"
              element={<AdminLeaveBalances />}
            />
          </Route>

          <Route
            path="/assistant"
            element={<Assistant />}
          />


          <Route
  path="/payroll"
  element={
    <ProtectedRoute>
      <Payroll />
    </ProtectedRoute>
  }
/>
<Route
  path="/payroll/:id/payslip"
  element={
    <ProtectedRoute>
      <Payslip />
    </ProtectedRoute>
  }
/>

<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  }
/>

<Route
  path="/offboarding"
  element={
    <ProtectedRoute>
      <Offboarding />
    </ProtectedRoute>
  }
/>
<Route
  path="/documents"
  element={
    <ProtectedRoute>
      <Documents user={user} />
    </ProtectedRoute>
  }
/>
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>
<Route
  path="/audit-logs"
  element={
    <ProtectedRoute>
      <AuditLogs />
    </ProtectedRoute>
  }
/>
        </Route>
      </Route>
    </Routes>
  );
}
