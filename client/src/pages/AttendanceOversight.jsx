import { useEffect, useState } from "react";
import {
  getEmployees,
} from "../api/employees.js";
import {
  getEmployeeAttendance,
  getAllAttendance,
} from "../api/attendance.js";
import { useAuth } from "../context/AuthContext.jsx";

const AttendanceOversight = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [attendance, setAttendance] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);
  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setError("");

        const data = await getEmployees();

        const activeEmployees = Array.isArray(data)
          ? data.filter(
              (employee) => employee.status === "active"
            )
          : [];

        setEmployees(activeEmployees);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load employees."
        );
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEmployeeChange = async (event) => {
    const employeeId = event.target.value;

    setSelectedEmployeeId(employeeId);
    setAttendance([]);
    setError("");
    setMessage("");

    if (!employeeId) {
      return;
    }

    try {
      setLoadingAttendance(true);

      const data = await getEmployeeAttendance(employeeId);

      setAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.response?.status === 403) {
        setError(
          "You are not authorized to view this employee's attendance."
        );
      } else if (error.response?.status === 404) {
        setError("Employee was not found.");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load employee attendance."
        );
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAdminAttendanceSearch = async (
    event
  ) => {
    event.preventDefault();

    if (!startDate && !endDate) {
      setError(
        "Select at least one date before searching."
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      setError(
        "End date cannot be earlier than start date."
      );
      return;
    }

    try {
      setLoadingAttendance(true);
      setError("");
      setMessage("");
      setSelectedEmployeeId("");

      const data = await getAllAttendance(
        startDate || undefined,
        endDate || undefined
      );

      setAttendance(Array.isArray(data) ? data : []);
      setMessage("Attendance records loaded.");
    } catch (error) {
      if (error.response?.status === 403) {
        setError(
          "You are not authorized to view all attendance records."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load attendance records."
        );
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const selectedEmployee = employees.find(
    (employee) =>
      employee._id === selectedEmployeeId
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date) => {
    return date
      ? new Date(date).toLocaleTimeString()
      : "—";
  };

  if (loadingEmployees) {
    return <div>Loading employees...</div>;
  }

  return (
    <div>
      <header>
        <h1>Attendance Oversight</h1>

        <p>
          View attendance history for employees you are
          authorized to oversee.
        </p>
      </header>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      <section>
        <h2>Employee Attendance</h2>

        <label htmlFor="employee">
          Select employee
        </label>

        <select
          id="employee"
          value={selectedEmployeeId}
          onChange={handleEmployeeChange}
        >
          <option value="">
            Select an employee
          </option>

          {employees.map((employee) => (
            <option
              key={employee._id}
              value={employee._id}
            >
              {employee.name} — {employee.department}
            </option>
          ))}
        </select>
      </section>

      {isAdmin && (
        <section>
          <h2>Company Attendance Search</h2>

          <form
            onSubmit={handleAdminAttendanceSearch}
          >
            <div>
              <label htmlFor="startDate">
                Start date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="endDate">
                End date
              </label>

              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              disabled={loadingAttendance}
            >
              {loadingAttendance
                ? "Loading..."
                : "Search Attendance"}
            </button>
          </form>
        </section>
      )}

      <section>
        {selectedEmployee && (
          <h2>
            Attendance — {selectedEmployee.name}
          </h2>
        )}

        {loadingAttendance ? (
          <p>Loading attendance...</p>
        ) : attendance.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((record) => (
                <tr key={record._id}>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.status}</td>
                  <td>
                    {formatTime(record.checkIn)}
                  </td>
                  <td>
                    {formatTime(record.checkOut)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AttendanceOversight;