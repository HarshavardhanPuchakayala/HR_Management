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
        </Route>
      </Route>
    </Routes>
  );
}