import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <header>
        <h1>PeopleFlow</h1>

        <nav>
          <NavLink to="/">Dashboard</NavLink>{" "}
          <NavLink to="/profile">Profile</NavLink>{" "}
          <NavLink to="/attendance">Attendance</NavLink>{" "}
          <NavLink to="/leave-requests">
            Leave Requests
          </NavLink>{" "}
          <NavLink to="/leave-balances">
            Leave Balances
          </NavLink>

          {user?.role === "manager" && (
            <>
              {" "}
              <NavLink to="/team">
                Team
              </NavLink>{" "}
              <NavLink to="/team/leave-requests">
                Team Leave
              </NavLink>
            </>
          )}

          {(user?.role === "manager" ||
            user?.role === "admin") && (
            <>
              {" "}
              <NavLink to="/attendance/oversight">
                Attendance Oversight
              </NavLink>
            </>
          )}

          {user?.role === "admin" && (
            <>
              {" "}
              <NavLink to="/admin">
                Admin
              </NavLink>{" "}
              <NavLink to="/admin/employees">
                Employees
              </NavLink>{" "}
              <NavLink to="/admin/leave-requests">
                Leave Requests
              </NavLink>{" "}
              <NavLink to="/admin/leave-balances">
                Leave Balances
              </NavLink>
            </>
          )}

          {" "}
          <button type="button" onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;