// frontend/src/pages/Payslip.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPayslip } from "../api/payroll.js";

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

export default function Payslip() {
  const { id } = useParams();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayslip();
  }, [id]);

  const loadPayslip = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPayslip(id);

      setPayslip(response.payslip);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load payslip"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.message}>
          Loading payslip...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>
          {error}
        </div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div style={styles.page}>
        <div style={styles.message}>
          Payslip not found.
        </div>
      </div>
    );
  }

  const employee = payslip.employeeId;

  return (
    <div style={styles.page}>
      <div style={styles.actions}>
        <button
          onClick={() => window.print()}
          style={styles.printButton}
        >
          Print Payslip
        </button>
      </div>

      <div id="payslip" style={styles.payslip}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.companyName}>
              PeopleFlow
            </h1>

            <p style={styles.companyText}>
              Employee Payroll Statement
            </p>
          </div>

          <div style={styles.headerRight}>
            <strong>PAYSLIP</strong>

            <span>
              {MONTHS[
                payslip.payrollMonth - 1
              ]}{" "}
              {payslip.payrollYear}
            </span>
          </div>
        </header>

        <section style={styles.employeeSection}>
          <div>
            <span style={styles.label}>
              Employee
            </span>

            <strong style={styles.value}>
              {employee?.name || "-"}
            </strong>
          </div>

          <div>
            <span style={styles.label}>
              Employee Email
            </span>

            <strong style={styles.value}>
              {employee?.email || "-"}
            </strong>
          </div>

          <div>
            <span style={styles.label}>
              Department
            </span>

            <strong style={styles.value}>
              {employee?.department || "-"}
            </strong>
          </div>

          <div>
            <span style={styles.label}>
              Job Title
            </span>

            <strong style={styles.value}>
              {employee?.jobTitle || "-"}
            </strong>
          </div>

          <div>
            <span style={styles.label}>
              Pay Period
            </span>

            <strong style={styles.value}>
              {formatDate(
                payslip.periodStart
              )}{" "}
              -{" "}
              {formatDate(
                payslip.periodEnd
              )}
            </strong>
          </div>

          <div>
            <span style={styles.label}>
              Paid Days
            </span>

            <strong style={styles.value}>
              {payslip.paidDays} /{" "}
              {payslip.workingDays}
            </strong>
          </div>
        </section>

        <div style={styles.columns}>
          <SalaryTable
            title="Earnings"
            rows={[
              [
                "Basic Salary",
                payslip.earnings?.basic,
              ],
              [
                "HRA",
                payslip.earnings?.hra,
              ],
              [
                "Special Allowance",
                payslip.earnings
                  ?.specialAllowance,
              ],
              [
                "Conveyance Allowance",
                payslip.earnings
                  ?.conveyanceAllowance,
              ],
              [
                "Medical Allowance",
                payslip.earnings
                  ?.medicalAllowance,
              ],
              [
                "Other Allowance",
                payslip.earnings
                  ?.otherAllowance,
              ],
              [
                "Bonus",
                payslip.earnings?.bonus,
              ],
              [
                "Overtime",
                payslip.earnings?.overtime,
              ],
              [
                "Arrears",
                payslip.earnings?.arrears,
              ],
              [
                "Reimbursements",
                payslip.earnings
                  ?.reimbursements,
              ],
            ]}
            totalLabel="Gross Salary"
            total={payslip.grossPay}
          />

          <SalaryTable
            title="Deductions"
            rows={[
              [
                "Employee PF",
                payslip.deductions
                  ?.employeePf,
              ],
              [
                "Employee ESI",
                payslip.deductions
                  ?.employeeEsi,
              ],
              [
                "Professional Tax",
                payslip.deductions
                  ?.professionalTax,
              ],
              [
                "Income Tax / TDS",
                payslip.deductions?.tds,
              ],
              [
                "Voluntary PF",
                payslip.deductions
                  ?.voluntaryPf,
              ],
              [
                "Other Deductions",
                payslip.deductions?.other,
              ],
            ]}
            totalLabel="Total Deductions"
            total={payslip.totalDeductions}
          />
        </div>

        <section style={styles.netSalary}>
          <span>NET SALARY</span>

          <strong>
            {formatMoney(payslip.netPay)}
          </strong>
        </section>

        <section style={styles.employerSection}>
          <h3 style={styles.sectionTitle}>
            Employer Contributions
          </h3>

          <div style={styles.employerRows}>
            <div style={styles.employerRow}>
              <span>Employer PF</span>

              <strong>
                {formatMoney(
                  payslip
                    .employerContributions
                    ?.employerPf
                )}
              </strong>
            </div>

            <div style={styles.employerRow}>
              <span>Employer ESI</span>

              <strong>
                {formatMoney(
                  payslip
                    .employerContributions
                    ?.employerEsi
                )}
              </strong>
            </div>

            <div
              style={{
                ...styles.employerRow,
                ...styles.employerTotal,
              }}
            >
              <strong>
                Employer Cost
              </strong>

              <strong>
                {formatMoney(
                  payslip.employerCost
                )}
              </strong>
            </div>
          </div>
        </section>

        <section style={styles.taxSection}>
          <h3 style={styles.sectionTitle}>
            Payroll Information
          </h3>

          <div style={styles.infoGrid}>
            <Info
              label="Payroll Status"
              value={payslip.status}
            />

            <Info
              label="Rule Version"
              value={
                payslip.statutoryRuleVersion
              }
            />

            <Info
              label="Calculated"
              value={formatDate(
                payslip.calculatedAt
              )}
            />

            <Info
              label="Approved"
              value={formatDate(
                payslip.approvedAt
              )}
            />

            <Info
              label="Taxable Income"
              value={formatMoney(
                payslip.taxableIncome
              )}
            />

            <Info
              label="Loss of Pay Days"
              value={payslip.lossOfPayDays}
            />
          </div>
        </section>

        <footer style={styles.footer}>
          <p>
            This payslip is generated internally
            by PeopleFlow.
          </p>

          <p>
            No employee payroll data is
            automatically transmitted to any
            external or government system.
          </p>
        </footer>
      </div>
    </div>
  );
}

function SalaryTable({
  title,
  rows,
  totalLabel,
  total,
}) {
  return (
    <section>
      <h2 style={styles.sectionTitle}>
        {title}
      </h2>

      <div style={styles.table}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={styles.row}
          >
            <span>{label}</span>

            <span>
              {formatMoney(value)}
            </span>
          </div>
        ))}

        <div
          style={{
            ...styles.row,
            ...styles.totalRow,
          }}
        >
          <strong>{totalLabel}</strong>

          <strong>
            {formatMoney(total)}
          </strong>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <span style={styles.label}>
        {label}
      </span>

      <strong style={styles.value}>
        {value || "-"}
      </strong>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "16px",
  },

  printButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },

  payslip: {
    background: "#fff",
    padding: "36px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: "24px",
    borderBottom: "2px solid #0f172a",
  },

  companyName: {
    margin: 0,
    fontSize: "28px",
  },

  companyText: {
    margin: "5px 0 0",
    color: "#64748b",
  },

  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  },

  employeeSection: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    padding: "24px 0",
    borderBottom: "1px solid #e2e8f0",
  },

  label: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "5px",
  },

  value: {
    display: "block",
    fontSize: "14px",
  },

  columns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "28px",
    marginTop: "28px",
  },

  sectionTitle: {
    fontSize: "16px",
    margin: "0 0 12px",
  },

  table: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
  },

  totalRow: {
    borderBottom: "none",
    background: "#f8fafc",
  },

  netSalary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "28px",
    padding: "18px 20px",
    borderRadius: "8px",
    background: "#f1f5f9",
    fontSize: "18px",
  },

  employerSection: {
    marginTop: "28px",
  },

  employerRows: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
  },

  employerRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "11px 14px",
    borderBottom: "1px solid #f1f5f9",
  },

  employerTotal: {
    borderBottom: "none",
    background: "#f8fafc",
  },

  taxSection: {
    marginTop: "28px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
  },

  footer: {
    marginTop: "32px",
    paddingTop: "18px",
    borderTop: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "11px",
  },

  error: {
    padding: "14px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
  },

  message: {
    padding: "30px",
    textAlign: "center",
  },
};