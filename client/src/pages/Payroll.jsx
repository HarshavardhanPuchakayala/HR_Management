
import { useEffect, useState } from "react";

import {
  getPayrollRuns,
  calculatePayroll,
  calculateBulkPayroll,
  approvePayroll,
} from "../api/payroll.js";

import api from "../api/axios.js";

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

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN");
};

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);

  const [employeeId, setEmployeeId] = useState("");

  const [month, setMonth] = useState(
    currentDate.getMonth() + 1
  );

  const [year, setYear] = useState(
    currentDate.getFullYear()
  );

  const [workingDays, setWorkingDays] = useState(30);
  const [paidDays, setPaidDays] = useState(30);

  const [selectedPayroll, setSelectedPayroll] =
    useState(null);

  const [loading, setLoading] = useState(false);

  const [bulkLoading, setBulkLoading] =
    useState(false);

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);

  const [loadingRuns, setLoadingRuns] =
    useState(false);

  const [bulkResult, setBulkResult] =
    useState(null);

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

      const response =
        await api.get("/employees");

      setEmployees(
        response.data.employees || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load employees"
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadPayrollRuns = async () => {
    try {
      setLoadingRuns(true);

      const response = await getPayrollRuns({
        year,
        month,
      });

      setPayrollRuns(
        response.payrollRuns || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load payroll"
      );
    } finally {
      setLoadingRuns(false);
    }
  };

  const validatePayrollDays = () => {
    if (workingDays <= 0) {
      setError(
        "Working days must be greater than zero"
      );

      return false;
    }

    if (
      paidDays < 0 ||
      paidDays > workingDays
    ) {
      setError(
        "Paid days must be between 0 and working days"
      );

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
      setError(
        "Please select an employee"
      );

      return;
    }

    if (!validatePayrollDays()) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await calculatePayroll(
          employeeId,
          {
            month: Number(month),
            year: Number(year),
            workingDays:
              Number(workingDays),
            paidDays:
              Number(paidDays),
          }
        );

      setSelectedPayroll(
        response.payroll
      );

      setSuccess(
        "Payroll calculated successfully"
      );

      await loadPayrollRuns();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to calculate payroll"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCalculate = async () => {
    setError("");
    setSuccess("");
    setBulkResult(null);

    if (!validatePayrollDays()) {
      return;
    }

    try {
      setBulkLoading(true);

      const response =
        await calculateBulkPayroll({
          month: Number(month),
          year: Number(year),
          workingDays:
            Number(workingDays),
          paidDays:
            Number(paidDays),
        });

      setBulkResult(
        response.results
      );

      setSuccess(
        "Bulk payroll processing completed"
      );

      await loadPayrollRuns();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to process bulk payroll"
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayroll?._id) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response =
        await approvePayroll(
          selectedPayroll._id
        );

      setSelectedPayroll(
        response.payroll
      );

      setSuccess(
        "Payroll approved successfully"
      );

      await loadPayrollRuns();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to approve payroll"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPayroll = (
    payroll
  ) => {
    setSelectedPayroll(payroll);
    setError("");
    setSuccess("");
    setBulkResult(null);
  };

  const handleViewPayslip = () => {
    if (!selectedPayroll?._id) {
      return;
    }

    window.open(
      `/payroll/${selectedPayroll._id}/payslip`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Payroll
          </h1>

          <p style={styles.subtitle}>
            Calculate and manage employee
            payroll internally.
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Calculate Payroll
        </h2>

        <form
          onSubmit={handleCalculate}
        >
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>
                Employee
              </label>

              <select
                value={employeeId}
                onChange={(event) =>
                  setEmployeeId(
                    event.target.value
                  )
                }
                style={styles.input}
                disabled={
                  loadingEmployees ||
                  loading ||
                  bulkLoading
                }
              >
                <option value="">
                  Select employee
                </option>

                {employees.map(
                  (employee) => (
                    <option
                      key={employee._id}
                      value={employee._id}
                    >
                      {employee.name} —{" "}
                      {employee.department ||
                        "No department"}
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Month
              </label>

              <select
                value={month}
                onChange={(event) =>
                  setMonth(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={styles.input}
                disabled={
                  loading ||
                  bulkLoading
                }
              >
                {MONTHS.map(
                  (name, index) => (
                    <option
                      key={name}
                      value={index + 1}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Year
              </label>

              <input
                type="number"
                value={year}
                onChange={(event) =>
                  setYear(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={styles.input}
                min="2020"
                disabled={
                  loading ||
                  bulkLoading
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Working Days
              </label>

              <input
                type="number"
                value={workingDays}
                onChange={(event) =>
                  setWorkingDays(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={styles.input}
                min="1"
                disabled={
                  loading ||
                  bulkLoading
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Paid Days
              </label>

              <input
                type="number"
                value={paidDays}
                onChange={(event) =>
                  setPaidDays(
                    Number(
                      event.target.value
                    )
                  )
                }
                style={styles.input}
                min="0"
                disabled={
                  loading ||
                  bulkLoading
                }
              />
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="submit"
              disabled={
                loading ||
                bulkLoading
              }
              style={
                styles.primaryButton
              }
            >
              {loading
                ? "Calculating..."
                : "Calculate Payroll"}
            </button>

            <button
              type="button"
              onClick={
                handleBulkCalculate
              }
              disabled={
                loading ||
                bulkLoading
              }
              style={
                styles.bulkButton
              }
            >
              {bulkLoading
                ? "Processing All Employees..."
                : "Calculate All Employees"}
            </button>
          </div>
        </form>
      </div>

      {bulkResult && (
        <div style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Bulk Payroll Result
              </h2>

              <p style={styles.muted}>
                {MONTHS[month - 1]}{" "}
                {year}
              </p>
            </div>
          </div>

          <div style={styles.summaryGrid}>
            <SummaryCard
              label="Total Employees"
              value={
                bulkResult.totalEmployees
              }
            />

            <SummaryCard
              label="Calculated"
              value={
                bulkResult.calculated
              }
            />

            <SummaryCard
              label="Skipped"
              value={
                bulkResult.skipped
              }
            />

            <SummaryCard
              label="Failed"
              value={
                bulkResult.failed
              }
            />
          </div>

          {bulkResult.errors?.length >
            0 && (
            <div
              style={
                styles.bulkErrors
              }
            >
              <h3
                style={
                  styles.subTitle
                }
              >
                Processing Details
              </h3>

              {bulkResult.errors.map(
                (item, index) => (
                  <div
                    key={`${item.employeeId}-${index}`}
                    style={
                      styles.bulkErrorRow
                    }
                  >
                    <div>
                      <strong>
                        {
                          item.employeeName
                        }
                      </strong>

                      <div
                        style={
                          styles.muted
                        }
                      >
                        {item.status}
                      </div>
                    </div>

                    <span>
                      {item.message}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {selectedPayroll && (
        <PayrollDetails
          payroll={
            selectedPayroll
          }
          onApprove={
            handleApprove
          }
          onViewPayslip={
            handleViewPayslip
          }
          loading={loading}
        />
      )}

      <div style={styles.card}>
        <div style={styles.listHeader}>
          <div>
            <h2
              style={
                styles.sectionTitle
              }
            >
              Payroll History
            </h2>

            <p style={styles.muted}>
              {MONTHS[month - 1]}{" "}
              {year}
            </p>
          </div>

          <button
            onClick={
              loadPayrollRuns
            }
            disabled={
              loadingRuns ||
              bulkLoading
            }
            style={
              styles.secondaryButton
            }
          >
            {loadingRuns
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {payrollRuns.length ===
        0 ? (
          <p style={styles.empty}>
            No payroll records found.
          </p>
        ) : (
          <div
            style={
              styles.tableWrapper
            }
          >
            <table
              style={styles.table}
            >
              <thead>
                <tr>
                  <th
                    style={styles.th}
                  >
                    Employee
                  </th>

                  <th
                    style={styles.th}
                  >
                    Gross
                  </th>

                  <th
                    style={styles.th}
                  >
                    Deductions
                  </th>

                  <th
                    style={styles.th}
                  >
                    Net Pay
                  </th>

                  <th
                    style={styles.th}
                  >
                    Status
                  </th>

                  <th
                    style={styles.th}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {payrollRuns.map(
                  (payroll) => (
                    <tr
                      key={
                        payroll._id
                      }
                    >
                      <td
                        style={
                          styles.td
                        }
                      >
                        {payroll
                          .employeeId
                          ?.name ||
                          "Unknown"}
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        {formatMoney(
                          payroll.grossPay
                        )}
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        {formatMoney(
                          payroll.totalDeductions
                        )}
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        <strong>
                          {formatMoney(
                            payroll.netPay
                          )}
                        </strong>
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        <span
                          style={{
                            ...styles.status,
                            ...getStatusStyle(
                              payroll.status
                            ),
                          }}
                        >
                          {
                            payroll.status
                          }
                        </span>
                      </td>

                      <td
                        style={
                          styles.td
                        }
                      >
                        <button
                          onClick={() =>
                            handleSelectPayroll(
                              payroll
                            )
                          }
                          style={
                            styles.secondaryButton
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PayrollDetails({
  payroll,
  onApprove,
  onViewPayslip,
  loading,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.listHeader}>
        <div>
          <h2
            style={
              styles.sectionTitle
            }
          >
            Payroll Details
          </h2>

          <p style={styles.muted}>
            {payroll.employeeId
              ?.name ||
              "Employee"}{" "}
            ·{" "}
            {
              MONTHS[
                payroll.payrollMonth -
                  1
              ]
            }{" "}
            {payroll.payrollYear}
          </p>
        </div>

        <span
          style={{
            ...styles.status,
            ...getStatusStyle(
              payroll.status
            ),
          }}
        >
          {payroll.status}
        </span>
      </div>

      <div style={styles.summaryGrid}>
        <SummaryCard
          label="Gross Pay"
          value={formatMoney(
            payroll.grossPay
          )}
        />

        <SummaryCard
          label="Total Deductions"
          value={formatMoney(
            payroll.totalDeductions
          )}
        />

        <SummaryCard
          label="Net Salary"
          value={formatMoney(
            payroll.netPay
          )}
        />

        <SummaryCard
          label="Employer Cost"
          value={formatMoney(
            payroll.employerCost
          )}
        />
      </div>

      <div style={styles.columns}>
        <PayrollBreakdown
          title="Earnings"
          rows={[
            [
              "Basic",
              payroll.earnings?.basic,
            ],
            [
              "HRA",
              payroll.earnings?.hra,
            ],
            [
              "Special Allowance",
              payroll.earnings
                ?.specialAllowance,
            ],
            [
              "Conveyance",
              payroll.earnings
                ?.conveyanceAllowance,
            ],
            [
              "Medical Allowance",
              payroll.earnings
                ?.medicalAllowance,
            ],
            [
              "Other Allowance",
              payroll.earnings
                ?.otherAllowance,
            ],
            [
              "Bonus",
              payroll.earnings?.bonus,
            ],
            [
              "Overtime",
              payroll.earnings?.overtime,
            ],
            [
              "Arrears",
              payroll.earnings?.arrears,
            ],
            [
              "Reimbursements",
              payroll.earnings
                ?.reimbursements,
            ],
          ]}
          totalLabel="Gross Pay"
          total={payroll.grossPay}
        />

        <PayrollBreakdown
          title="Deductions"
          rows={[
            [
              "Employee PF",
              payroll.deductions
                ?.employeePf,
            ],
            [
              "Employee ESI",
              payroll.deductions
                ?.employeeEsi,
            ],
            [
              "Professional Tax",
              payroll.deductions
                ?.professionalTax,
            ],
            [
              "TDS",
              payroll.deductions?.tds,
            ],
            [
              "Voluntary PF",
              payroll.deductions
                ?.voluntaryPf,
            ],
            [
              "Other",
              payroll.deductions?.other,
            ],
          ]}
          totalLabel="Total Deductions"
          total={
            payroll.totalDeductions
          }
        />
      </div>

      <div style={styles.employerBox}>
        <h3
          style={styles.subTitle}
        >
          Employer Contributions
        </h3>

        <div style={styles.row}>
          <span>Employer PF</span>

          <strong>
            {formatMoney(
              payroll
                .employerContributions
                ?.employerPf
            )}
          </strong>
        </div>

        <div style={styles.row}>
          <span>Employer ESI</span>

          <strong>
            {formatMoney(
              payroll
                .employerContributions
                ?.employerEsi
            )}
          </strong>
        </div>
      </div>

      <div style={styles.footer}>
        <div>
          <span style={styles.muted}>
            Calculated
          </span>

          <div>
            {formatDate(
              payroll.calculatedAt
            )}
          </div>
        </div>

        <div
          style={
            styles.actionGroup
          }
        >
          <button
            onClick={
              onViewPayslip
            }
            style={
              styles.secondaryButton
            }
          >
            View Payslip
          </button>

          {payroll.status ===
            "calculated" && (
            <button
              onClick={onApprove}
              disabled={loading}
              style={
                styles.approveButton
              }
            >
              {loading
                ? "Approving..."
                : "Approve Payroll"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PayrollBreakdown({
  title,
  rows,
  totalLabel,
  total,
}) {
  return (
    <div>
      <h3
        style={styles.subTitle}
      >
        {title}
      </h3>

      <div
        style={styles.breakdown}
      >
        {rows.map(
          ([label, value]) => (
            <div
              style={styles.row}
              key={label}
            >
              <span>{label}</span>

              <span>
                {formatMoney(value)}
              </span>
            </div>
          )
        )}

        <div
          style={{
            ...styles.row,
            ...styles.totalRow,
          }}
        >
          <strong>
            {totalLabel}
          </strong>

          <strong>
            {formatMoney(total)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <div
      style={
        styles.summaryCard
      }
    >
      <span style={styles.muted}>
        {label}
      </span>

      <strong
        style={
          styles.summaryValue
        }
      >
        {value}
      </strong>
    </div>
  );
}

const getStatusStyle = (
  status
) => {
  if (status === "approved") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "paid") {
    return {
      background: "#dbeafe",
      color: "#1e40af",
    };
  }

  if (status === "locked") {
    return {
      background: "#f3e8ff",
      color: "#6b21a8",
    };
  }

  return {
    background: "#fef3c7",
    color: "#92400e",
  };
};

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
  },

  subtitle: {
    marginTop: "6px",
    color: "#64748b",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  subTitle: {
    fontSize: "16px",
    marginBottom: "12px",
  },

  muted: {
    color: "#64748b",
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "14px",
    fontWeight: 600,
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
  },

  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "20px",
  },

  primaryButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  bulkButton: {
    padding: "11px 18px",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    background: "#fff",
    color: "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "9px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
  },

  approveButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  error: {
    padding: "12px 16px",
    marginBottom: "16px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
  },

  success: {
    padding: "12px 16px",
    marginBottom: "16px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#166534",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },

  summaryCard: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },

  summaryValue: {
    display: "block",
    fontSize: "20px",
    marginTop: "6px",
  },

  columns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "32px",
  },

  breakdown: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom:
      "1px solid #f1f5f9",
  },

  totalRow: {
    background: "#f8fafc",
    borderBottom: "none",
  },

  employerBox: {
    marginTop: "28px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
  },

  footer: {
    marginTop: "28px",
    paddingTop: "20px",
    borderTop:
      "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom:
      "1px solid #e2e8f0",
    fontSize: "13px",
  },

  td: {
    padding: "12px",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize: "14px",
  },

  empty: {
    color: "#64748b",
    padding: "20px 0",
  },

  bulkErrors: {
    marginTop: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
  },

  bulkErrorRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "12px 14px",
    borderBottom:
      "1px solid #f1f5f9",
    fontSize: "14px",
  },
};