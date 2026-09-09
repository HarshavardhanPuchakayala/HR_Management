import { useEffect, useMemo, useState } from "react";
import {
  checkIn,
  checkOut,
  getMyAttendance,
} from "../api/attendance.js";
import { useAuth } from "../context/AuthContext.jsx";

const Dashboard = () => {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchAttendance = async () => {
    try {
      setError("");

      const data = await getMyAttendance();

      setAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const todayAttendance = useMemo(() => {
    const today = new Date();

    return attendance.find((record) => {
      const recordDate = new Date(record.date);

      return (
        recordDate.getFullYear() === today.getFullYear() &&
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getDate() === today.getDate()
      );
    });
  }, [attendance]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      await checkIn();

      setMessage("Checked in successfully.");
      await fetchAttendance();
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        setMessage("You are already checked in for today.");
        await fetchAttendance();
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to check in. Please try again."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      await checkOut();

      setMessage("Checked out successfully.");
      await fetchAttendance();
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        setMessage("You have already checked out for today.");
        await fetchAttendance();
      } else if (status === 400) {
        setMessage("Please check in before checking out.");
        await fetchAttendance();
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to check out. Please try again."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getAttendanceAction = () => {
    if (!todayAttendance) {
      return {
        label: "Check In",
        action: handleCheckIn,
      };
    }

    if (todayAttendance.checkIn && !todayAttendance.checkOut) {
      return {
        label: "Check Out",
        action: handleCheckOut,
      };
    }

    return null;
  };

  const action = getAttendanceAction();

  const recentAttendance = attendance.slice(0, 5);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <header>
        <h1>Welcome, {user?.employeeId?.name || user?.email}</h1>
        <p>Today's attendance</p>
      </header>

      <section>
        {!todayAttendance && (
          <>
            <h2>Not checked in</h2>
            <p>You haven't checked in today.</p>

            <button
              type="button"
              onClick={action.action}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : action.label}
            </button>
          </>
        )}

        {todayAttendance &&
          todayAttendance.checkIn &&
          !todayAttendance.checkOut && (
            <>
              <h2>You're checked in</h2>
              <p>
                Check-in:{" "}
                {new Date(
                  todayAttendance.checkIn
                ).toLocaleTimeString()}
              </p>

              <button
                type="button"
                onClick={action.action}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : action.label}
              </button>
            </>
          )}

        {todayAttendance &&
          todayAttendance.checkIn &&
          todayAttendance.checkOut && (
            <>
              <h2>Attendance completed</h2>
              <p>
                Check-in:{" "}
                {new Date(
                  todayAttendance.checkIn
                ).toLocaleTimeString()}
              </p>
              <p>
                Check-out:{" "}
                {new Date(
                  todayAttendance.checkOut
                ).toLocaleTimeString()}
              </p>
              <p>You're all done for today. 👍</p>
            </>
          )}
      </section>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      <section>
        <h2>Recent Attendance</h2>

        {recentAttendance.length === 0 ? (
          <p>No attendance records yet.</p>
        ) : (
          <ul>
            {recentAttendance.map((record) => (
              <li key={record._id}>
                <strong>
                  {new Date(record.date).toLocaleDateString()}
                </strong>{" "}
                — {record.status}
                {record.checkIn && (
                  <> · In: {new Date(record.checkIn).toLocaleTimeString()}</>
                )}
                {record.checkOut && (
                  <> · Out: {new Date(record.checkOut).toLocaleTimeString()}</>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;