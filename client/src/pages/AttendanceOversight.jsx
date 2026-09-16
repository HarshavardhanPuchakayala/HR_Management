import { useEffect, useState } from "react";
import { LuSearch, LuClock } from "react-icons/lu";
import { getEmployees } from "../api/employees.js";
import {
  getEmployeeAttendance,
  getAllAttendance,
} from "../api/attendance.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  PageHeader,
  Alert,
  Card,
  Table,
  Td,
  Field,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";

const AttendanceOversight = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [attendance, setAttendance] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setError("");

        const data = await getEmployees();

        const activeEmployees = Array.isArray(data)
          ? data.filter((employee) => employee.status === "active")
          : [];

        setEmployees(activeEmployees);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load employees."
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

    if (!employeeId) return;

    try {
      setLoadingAttendance(true);

      const data = await getEmployeeAttendance(employeeId);

      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(
          "You are not authorized to view this employee's attendance."
        );
      } else if (err.response?.status === 404) {
        setError("Employee was not found.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load employee attendance."
        );
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAdminAttendanceSearch = async (event) => {
    event.preventDefault();

    if (!startDate && !endDate) {
      setError("Select at least one date before searching.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError("End date cannot be earlier than start date.");
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
    } catch (err) {
      if (err.response?.status === 403) {
        setError(
          "You are not authorized to view all attendance records."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load attendance records."
        );
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const selectedEmployee = employees.find(
    (employee) => employee._id === selectedEmployeeId
  );

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString() : "—";

  if (loadingEmployees) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading employees...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Attendance Oversight"
        subtitle="Attendance history for the people you're authorized to oversee."
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="By employee">
          <Field label="Select employee" htmlFor="employee">
            <select
              id="employee"
              className="field-input"
              value={selectedEmployeeId}
              onChange={handleEmployeeChange}
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} — {employee.department}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        {isAdmin && (
          <Card title="Across the company">
            <form onSubmit={handleAdminAttendanceSearch}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start date" htmlFor="startDate">
                  <input
                    id="startDate"
                    type="date"
                    className="field-input"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </Field>

                <Field label="End date" htmlFor="endDate">
                  <input
                    id="endDate"
                    type="date"
                    className="field-input"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={loadingAttendance}
                className="btn-primary mt-4"
              >
                <LuSearch size={15} />
                {loadingAttendance ? "Loading..." : "Search attendance"}
              </button>
            </form>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">
          {selectedEmployee
            ? `Attendance — ${selectedEmployee.name}`
            : "Attendance records"}
        </h2>

        {loadingAttendance ? (
          <p className="text-slate">Loading attendance...</p>
        ) : attendance.length === 0 ? (
          <EmptyState
            icon={LuClock}
            title="No attendance records"
            hint="Pick an employee, or search a date range, to see records here."
          />
        ) : (
          <Table head={["Date", "Status", "Check in", "Check out"]}>
            {attendance.map((record) => (
              <tr key={record._id} className="bg-surface">
                <Td className="font-medium">{formatDate(record.date)}</Td>
                <Td>
                  <StatusPill status={record.status} />
                </Td>
                <Td className="text-slate">{formatTime(record.checkIn)}</Td>
                <Td className="text-slate">
                  {formatTime(record.checkOut)}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
};

export default AttendanceOversight;