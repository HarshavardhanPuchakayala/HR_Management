import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

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
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/not-authorized" element={<NotAuthorized />} />

      {/* Any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/attendance" element={<Attendance />} />
      </Route>

      {/* Admin or Manager */}
      <Route
        element={
          <RoleRoute allowedRoles={["admin", "manager"]} />
        }
      >
        <Route path="/team" element={<TeamDashboard />} />
      </Route>

      {/* Admin only */}
      <Route
        element={<RoleRoute allowedRoles={["admin"]} />}
      >
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}