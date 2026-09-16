import { useEffect, useState } from "react";
import { LuCalculator, LuUsers, LuCheck, LuFileText } from "react-icons/lu";
import {
  getPayrollRuns,
  calculatePayroll,
  calculateBulkPayroll,
  approvePayroll,
} from "../api/payroll.js";
import api from "../api/axios.js";
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

const currentDate = new Date();

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [workingDays, setWorkingDays] = useState(30);
  const [paidDays, setPaidDays] = useState(30);

  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const [bulkResult, setBulkResult] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadPayrollRuns();
  }, [month, year]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);

      const response = await api.get("/employees");

      // Tolerate either response shape — see note in the README about
      // /employees returning a bare array on some pages.
      setEmployees(
        Array.isArray(response.data)
          ? response.data
          : response.data?.employees || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load employees"
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadPayrollRuns = async () => {
    try {
      setLoadingRuns(true);

      const response = await getPayrollRuns({ year, month });

      setPayrollRuns(response.payrollRuns || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payroll");
    } finally {
      setLoadingRuns(false);
    }
  };

  const validatePayrollDays = () => {
    if (workingDays <= 0) {
      setError("Working days must be greater than zero");
      return false;
    }

    if (paidDays < 0 || paidDays > workingDays) {
      setError("Paid days must be between 0 and working days");
      return false;
    }

    return true;
  };

  const handleCalculate = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSelectedPayroll(null);

    if (!employeeId) {
      setError("Please select an employee");
      return;
    }

    if (!validatePayrollDays()) return;

    try {
      setLoading(true);

      const response = await calculatePayroll(employeeId, {
        month: Number(month),
        year: Number(year),
        workingDays: Number(workingDays),
        paidDays: Number(paidDays),
      });

      setSelectedPayroll(response.payroll);
      setSuccess("Payroll calculated.");

      await loadPayrollRuns();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to calculate payroll"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCalculate = async () => {
    setError("");
    setSuccess("");
    setBulkResult(null);

    if (!validatePayrollDays()) return;

    try {
      setBulkLoading(true);

      const response = await calculateBulkPayroll({
        month: Number(month),
        year: Number(year),
        workingDays: Number(workingDays),
        paidDays: Number(paidDays),
      });

      setBulkResult(response.results);
      setSuccess("Bulk payroll processing completed.");

      await loadPayrollRuns();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to process bulk payroll"
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayroll?._id) return;

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await approvePayroll(selectedPayroll._id);

      setSelectedPayroll(response.payroll);
      setSuccess("Payroll approved.");

      await loadPayrollRuns();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to approve payroll"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setError("");
    setSuccess("");
    setBulkResult(null);
  };

  const handleViewPayslip = () => {
    if (!selectedPayroll?._id) return;

    window.open(
      `/payroll/${selectedPayroll._id}/payslip`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Calculate and approve pay for a period. Nothing leaves PeopleFlow."
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{success}</Alert>

      <Card title="Run payroll" className="mb-6">
        <form onSubmit={handleCalculate}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Field label="Employee" htmlFor="payrollEmployee">
                <select
                  id="payrollEmployee"
                  className="field-input"
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  disabled={
                    loadingEmployees || loading || bulkLoading
                  }
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name} —{" "}
                      {employee.department || "No department"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Month" htmlFor="payrollMonth">
              <select
                id="payrollMonth"
                className="field-input"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Year" htmlFor="payrollYear">
              <input
                id="payrollYear"
                type="number"
                min="2000"
                max="2100"
                className="field-input"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Working days" htmlFor="workingDays">
                <input
                  id="workingDays"
                  type="number"
                  min="1"
                  className="field-input"
                  value={workingDays}
                  onChange={(event) =>
                    setWorkingDays(Number(event.target.value))
                  }
                />
              </Field>

              <Field label="Paid days" htmlFor="paidDays">
                <input
                  id="paidDays"
                  type="number"
                  min="0"
                  className="field-input"
                  value={paidDays}
                  onChange={(event) =>
                    setPaidDays(Number(event.target.value))
                  }
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || bulkLoading}
              className="btn-primary"
            >
              <LuCalculator size={15} />
              {loading ? "Calculating..." : "Calculate for employee"}
            </button>

            <button
              type="button"
              onClick={handleBulkCalculate}
              disabled={loading || bulkLoading}
              className="btn-secondary"
            >
              <LuUsers size={15} />
              {bulkLoading ? "Processing..." : "Run for everyone"}
            </button>
          </div>
        </form>
      </Card>

      {bulkResult && (
        <Card title="Bulk run results" className="mb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Employees", bulkResult.totalEmployees, "bg-ink text-white"],
              ["Calculated", bulkResult.calculated, "bg-mint text-ink"],
              ["Skipped", bulkResult.skipped, "bg-amber text-ink"],
              ["Failed", bulkResult.failed, "bg-coral text-white"],
            ].map(([label, value, tone]) => (
              <div key={label} className={`rounded-xl p-4 ${tone}`}>
                <p className="text-xs opacity-70">{label}</p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  {value ?? 0}
                </p>
              </div>
            ))}
          </div>

          {bulkResult.errors?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">
                Couldn't process
              </p>
              <div className="space-y-2">
                {bulkResult.errors.map((item) => (
                  <div
                    key={item.employeeId}
                    className="rounded-xl bg-coral/10 px-4 py-2.5 text-sm text-coralDark"
                  >
                    <strong>{item.employeeName || item.employeeId}</strong>
                    {" — "}
                    {item.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {selectedPayroll && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate">
                {selectedPayroll.employeeId?.name || "Employee"} ·{" "}
                {MONTHS[selectedPayroll.payrollMonth - 1]}{" "}
                {selectedPayroll.payrollYear}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">
                {formatMoney(selectedPayroll.netPay)}
              </p>
              <p className="mt-1 text-sm text-slate">Net pay</p>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill status={selectedPayroll.status} />

              <button
                type="button"
                onClick={handleViewPayslip}
                className="btn-secondary"
              >
                <LuFileText size={15} />
                View payslip
              </button>

              {selectedPayroll.status !== "approved" && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="btn-primary"
                >
                  <LuCheck size={15} />
                  Approve
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            {[
              ["Gross pay", selectedPayroll.grossPay],
              ["Deductions", selectedPayroll.totalDeductions],
              ["Net pay", selectedPayroll.netPay],
              ["Employer cost", selectedPayroll.employerCost],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-slate">{label}</p>
                <p className="mt-1 font-display font-semibold">
                  {formatMoney(value)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="mb-4 text-lg font-semibold">
        {MONTHS[month - 1]} {year} runs
      </h2>

      {loadingRuns ? (
        <p className="text-slate">Loading payroll runs...</p>
      ) : payrollRuns.length === 0 ? (
        <EmptyState
          icon={LuCalculator}
          title={`No payroll run for ${MONTHS[month - 1]} ${year}`}
          hint="Calculate for one employee, or run payroll for everyone at once."
        />
      ) : (
        <Table
          head={["Employee", "Gross", "Deductions", "Net", "Status", ""]}
        >
          {payrollRuns.map((payroll) => (
            <tr key={payroll._id} className="bg-surface">
              <Td className="font-medium">
                {payroll.employeeId?.name || "Unknown"}
              </Td>
              <Td className="text-slate">
                {formatMoney(payroll.grossPay)}
              </Td>
              <Td className="text-slate">
                {formatMoney(payroll.totalDeductions)}
              </Td>
              <Td className="font-display font-semibold">
                {formatMoney(payroll.netPay)}
              </Td>
              <Td>
                <StatusPill status={payroll.status} />
              </Td>
              <Td>
                <button
                  type="button"
                  onClick={() => handleSelectPayroll(payroll)}
                  className="text-sm font-medium text-coral hover:text-coralDark"
                >
                  Open
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}