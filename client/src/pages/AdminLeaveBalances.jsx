import { useEffect, useState } from "react";

import {
  getEmployees,
} from "../api/employees.js";

import {
  initializeLeaveBalances,
  getEmployeeLeaveBalances,
  adjustLeaveBalance,
} from "../api/leaveBalances.js";

const LEAVE_TYPES = [
  "sick",
  "casual",
  "vacation",
  "other",
];

const AdminLeaveBalances = () => {
  const currentYear = new Date().getFullYear();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [year, setYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);

  const [form, setForm] = useState({
    sick: 0,
    casual: 0,
    vacation: 0,
    other: 0,
  });

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);
  const [loadingBalances, setLoadingBalances] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setError("");

        const data = await getEmployees();

        setEmployees(
          data.filter(
            (employee) => employee.status === "active"
          )
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load employees"
        );
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setBalances([]);
      return;
    }

    const loadBalances = async () => {
      try {
        setLoadingBalances(true);
        setError("");
        setMessage("");

        const data =
          await getEmployeeLeaveBalances(
            selectedEmployeeId,
            year
          );

        setBalances(data);

        const nextForm = {
          sick: 0,
          casual: 0,
          vacation: 0,
          other: 0,
        };

        for (const balance of data) {
          nextForm[balance.leaveType] =
            balance.totalAllotted;
        }

        setForm(nextForm);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load leave balances"
        );
      } finally {
        setLoadingBalances(false);
      }
    };

    loadBalances();
  }, [selectedEmployeeId, year]);

  const handleFormChange = (
    leaveType,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [leaveType]: value,
    }));
  };

  const handleInitialize = async (event) => {
    event.preventDefault();

    if (!selectedEmployeeId) {
      setError("Select an employee first.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const balanceData = LEAVE_TYPES.map(
        (leaveType) => ({
          leaveType,
          totalAllotted: Number(
            form[leaveType]
          ),
          carriedOver: 0,
        })
      );

      await initializeLeaveBalances(
        selectedEmployeeId,
        Number(year),
        balanceData
      );

      const updated =
        await getEmployeeLeaveBalances(
          selectedEmployeeId,
          year
        );

      setBalances(updated);

      setMessage(
        "Leave balances initialized successfully."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to initialize leave balances"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (
    balanceId,
    field,
    value
  ) => {
    try {
      setError("");
      setMessage("");

      await adjustLeaveBalance(balanceId, {
        [field]: Number(value),
      });

      const updated =
        await getEmployeeLeaveBalances(
          selectedEmployeeId,
          year
        );

      setBalances(updated);

      setMessage(
        "Leave balance updated successfully."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update leave balance"
      );
    }
  };

  if (loadingEmployees) {
    return <div>Loading employees...</div>;
  }

  return (
    <div>
      <h1>Leave Balance Management</h1>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      <div>
        <label htmlFor="employee">
          Employee
        </label>

        <select
          id="employee"
          value={selectedEmployeeId}
          onChange={(event) =>
            setSelectedEmployeeId(
              event.target.value
            )
          }
        >
          <option value="">
            Select employee
          </option>

          {employees.map((employee) => (
            <option
              key={employee._id}
              value={employee._id}
            >
              {employee.name} — {employee.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="year">
          Cycle Year
        </label>

        <input
          id="year"
          type="number"
          min="2000"
          max="2100"
          value={year}
          onChange={(event) =>
            setYear(event.target.value)
          }
        />
      </div>

      {selectedEmployeeId && (
        <>
          <h2>Initialize / Update Allotted Days</h2>

          <form onSubmit={handleInitialize}>
            {LEAVE_TYPES.map((leaveType) => (
              <div key={leaveType}>
                <label htmlFor={leaveType}>
                  {leaveType}
                </label>

                <input
                  id={leaveType}
                  type="number"
                  min="0"
                  step="1"
                  value={form[leaveType]}
                  onChange={(event) =>
                    handleFormChange(
                      leaveType,
                      event.target.value
                    )
                  }
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Initialize Balances"}
            </button>
          </form>

          <h2>
            Current Balances
          </h2>

          {loadingBalances ? (
            <p>Loading balances...</p>
          ) : balances.length === 0 ? (
            <p>
              No balances initialized for{" "}
              {year}.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Allotted</th>
                  <th>Carried Over</th>
                  <th>Used</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {balances.map((balance) => {
                  const available =
                    balance.totalAllotted +
                    balance.carriedOver -
                    balance.used;

                  return (
                    <tr key={balance._id}>
                      <td>
                        {balance.leaveType}
                      </td>

                      <td>
                        {balance.totalAllotted}
                      </td>

                      <td>
                        {balance.carriedOver}
                      </td>

                      <td>
                        {balance.used}
                      </td>

                      <td>{available}</td>

                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            const value =
                              window.prompt(
                                "New allotted days:",
                                balance.totalAllotted
                              );

                            if (
                              value !== null
                            ) {
                              handleAdjust(
                                balance._id,
                                "totalAllotted",
                                value
                              );
                            }
                          }}
                        >
                          Adjust Allotted
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const value =
                              window.prompt(
                                "New carried-over days:",
                                balance.carriedOver
                              );

                            if (
                              value !== null
                            ) {
                              handleAdjust(
                                balance._id,
                                "carriedOver",
                                value
                              );
                            }
                          }}
                        >
                          Adjust Carried Over
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const value =
                              window.prompt(
                                "New used days:",
                                balance.used
                              );

                            if (
                              value !== null
                            ) {
                              handleAdjust(
                                balance._id,
                                "used",
                                value
                              );
                            }
                          }}
                        >
                          Adjust Used
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLeaveBalances;