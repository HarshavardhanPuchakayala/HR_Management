import { useEffect, useState } from "react";
import { LuCheck, LuPencil, LuX } from "react-icons/lu";
import { getEmployees } from "../api/employees.js";
import {
  initializeLeaveBalances,
  getEmployeeLeaveBalances,
  adjustLeaveBalance,
} from "../api/leaveBalances.js";
import {
  PageHeader,
  Alert,
  Card,
  Table,
  Td,
  Field,
  EmptyState,
} from "../components/Ui.jsx";

const LEAVE_TYPES = ["sick", "casual", "vacation", "other"];

const AdminLeaveBalances = () => {
  const currentYear = new Date().getFullYear();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [year, setYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);

  const [form, setForm] = useState({
    sick: 0,
    casual: 0,
    vacation: 0,
    other: 0,
  });

  // { balanceId: { field, value } } — only one cell edits at a time.
  const [editingCell, setEditingCell] = useState(null);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
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
          data.filter((employee) => employee.status === "active")
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load employees"
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

        const data = await getEmployeeLeaveBalances(
          selectedEmployeeId,
          year
        );

        setBalances(data);

        const nextForm = { sick: 0, casual: 0, vacation: 0, other: 0 };

        for (const balance of data) {
          nextForm[balance.leaveType] = balance.totalAllotted;
        }

        setForm(nextForm);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load leave balances"
        );
      } finally {
        setLoadingBalances(false);
      }
    };

    loadBalances();
  }, [selectedEmployeeId, year]);

  const handleFormChange = (leaveType, value) => {
    setForm((current) => ({ ...current, [leaveType]: value }));
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

      const balanceData = LEAVE_TYPES.map((leaveType) => ({
        leaveType,
        totalAllotted: Number(form[leaveType]),
        carriedOver: 0,
      }));

      await initializeLeaveBalances(
        selectedEmployeeId,
        Number(year),
        balanceData
      );

      const updated = await getEmployeeLeaveBalances(
        selectedEmployeeId,
        year
      );

      setBalances(updated);
      setMessage("Leave balances saved.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to initialize leave balances"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (balanceId, field, value) => {
    try {
      setError("");
      setMessage("");

      await adjustLeaveBalance(balanceId, { [field]: Number(value) });

      const updated = await getEmployeeLeaveBalances(
        selectedEmployeeId,
        year
      );

      setBalances(updated);
      setEditingCell(null);
      setMessage("Leave balance updated.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update leave balance"
      );
    }
  };

  /** Inline-editable number cell — replaces the old window.prompt flow. */
  const EditableCell = ({ balance, field }) => {
    const isEditing =
      editingCell?.id === balance._id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            autoFocus
            className="w-20 rounded-lg border border-coral px-2 py-1 text-sm"
            value={editingCell.value}
            onChange={(event) =>
              setEditingCell({
                ...editingCell,
                value: event.target.value,
              })
            }
          />
          <button
            type="button"
            aria-label="Save value"
            onClick={() =>
              handleAdjust(balance._id, field, editingCell.value)
            }
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint text-ink"
          >
            <LuCheck size={14} />
          </button>
          <button
            type="button"
            aria-label="Cancel edit"
            onClick={() => setEditingCell(null)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-slate"
          >
            <LuX size={14} />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          setEditingCell({
            id: balance._id,
            field,
            value: balance[field],
          })
        }
        className="group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-canvas"
      >
        {balance[field]}
        <LuPencil
          size={12}
          className="text-slate opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
    );
  };

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
        title="Leave Balance Management"
        subtitle="Set allotments and correct balances for a leave cycle."
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Employee" htmlFor="employee">
              <select
                id="employee"
                className="field-input"
                value={selectedEmployeeId}
                onChange={(event) =>
                  setSelectedEmployeeId(event.target.value)
                }
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} — {employee.email}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Cycle year" htmlFor="year">
            <input
              id="year"
              type="number"
              min="2000"
              max="2100"
              className="field-input"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </Field>
        </div>
      </Card>

      {!selectedEmployeeId ? (
        <EmptyState
          title="Pick an employee to begin"
          hint="Choose someone above to view or set their leave balances."
        />
      ) : (
        <div className="space-y-6">
          <Card
            title="Allotted days"
            description="Sets the base allotment for each leave type in this cycle."
          >
            <form onSubmit={handleInitialize}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {LEAVE_TYPES.map((leaveType) => (
                  <Field
                    key={leaveType}
                    label={
                      leaveType.charAt(0).toUpperCase() + leaveType.slice(1)
                    }
                    htmlFor={leaveType}
                  >
                    <input
                      id={leaveType}
                      type="number"
                      min="0"
                      step="1"
                      className="field-input"
                      value={form[leaveType]}
                      onChange={(event) =>
                        handleFormChange(leaveType, event.target.value)
                      }
                    />
                  </Field>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary mt-5"
              >
                {saving ? "Saving..." : "Save allotments"}
              </button>
            </form>
          </Card>

          <Card
            title="Current balances"
            description="Click any number to correct it."
          >
            {loadingBalances ? (
              <p className="text-slate">Loading balances...</p>
            ) : balances.length === 0 ? (
              <p className="text-slate">
                No balances initialized for {year} yet. Save allotments above
                to create them.
              </p>
            ) : (
              <Table
                head={[
                  "Type",
                  "Allotted",
                  "Carried over",
                  "Used",
                  "Available",
                ]}
              >
                {balances.map((balance) => {
                  const available =
                    balance.totalAllotted +
                    balance.carriedOver -
                    balance.used;

                  return (
                    <tr key={balance._id}>
                      <Td className="font-medium capitalize">
                        {balance.leaveType}
                      </Td>
                      <Td>
                        <EditableCell
                          balance={balance}
                          field="totalAllotted"
                        />
                      </Td>
                      <Td>
                        <EditableCell
                          balance={balance}
                          field="carriedOver"
                        />
                      </Td>
                      <Td>
                        <EditableCell balance={balance} field="used" />
                      </Td>
                      <Td className="font-display font-semibold">
                        {available}
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveBalances;