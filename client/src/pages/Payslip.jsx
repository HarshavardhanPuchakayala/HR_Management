import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LuPrinter } from "react-icons/lu";
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

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate">{label}</p>
    <p className="mt-0.5 text-sm font-medium">{value || "-"}</p>
  </div>
);

const SalaryTable = ({ title, rows, totalLabel, total }) => (
  <section>
    <h2 className="mb-3 text-base font-semibold">{title}</h2>

    <div className="overflow-hidden rounded-xl border border-line">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between border-b border-line px-4 py-2.5 text-sm last:border-none"
        >
          <span className="text-slate">{label}</span>
          <span className="tabular-nums">{formatMoney(value)}</span>
        </div>
      ))}

      <div className="flex justify-between bg-canvas px-4 py-3 text-sm font-semibold">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{formatMoney(total)}</span>
      </div>
    </div>
  </section>
);

export default function Payslip() {
  const { id } = useParams();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPayslip = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPayslip(id);

        setPayslip(response.payslip);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load payslip"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPayslip();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading payslip...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coralDark">
        {error}
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Payslip not found.
      </div>
    );
  }

  const employee = payslip.employeeId;

  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary"
        >
          <LuPrinter size={15} />
          Print payslip
        </button>
      </div>

      <div
        id="payslip"
        className="card p-8 print:border-none print:shadow-none"
      >
        <header className="flex items-start justify-between border-b-2 border-ink pb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              PeopleFlow
            </h1>
            <p className="mt-1 text-sm text-slate">
              Employee payroll statement
            </p>
          </div>

          <div className="text-right">
            <p className="font-display font-semibold">PAYSLIP</p>
            <p className="text-sm text-slate">
              {MONTHS[payslip.payrollMonth - 1]} {payslip.payrollYear}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-5 border-b border-line py-6 sm:grid-cols-3">
          <Detail label="Employee" value={employee?.name} />
          <Detail label="Email" value={employee?.email} />
          <Detail label="Department" value={employee?.department} />
          <Detail label="Job title" value={employee?.jobTitle} />
          <Detail
            label="Pay period"
            value={`${formatDate(payslip.periodStart)} — ${formatDate(
              payslip.periodEnd
            )}`}
          />
          <Detail
            label="Paid days"
            value={`${payslip.paidDays} / ${payslip.workingDays}`}
          />
        </section>

        <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-2">
          <SalaryTable
            title="Earnings"
            rows={[
              ["Basic salary", payslip.earnings?.basic],
              ["HRA", payslip.earnings?.hra],
              ["Special allowance", payslip.earnings?.specialAllowance],
              [
                "Conveyance allowance",
                payslip.earnings?.conveyanceAllowance,
              ],
              ["Medical allowance", payslip.earnings?.medicalAllowance],
              ["Other allowance", payslip.earnings?.otherAllowance],
              ["Bonus", payslip.earnings?.bonus],
              ["Overtime", payslip.earnings?.overtime],
              ["Arrears", payslip.earnings?.arrears],
              ["Reimbursements", payslip.earnings?.reimbursements],
            ]}
            totalLabel="Gross salary"
            total={payslip.grossPay}
          />

          <SalaryTable
            title="Deductions"
            rows={[
              ["Employee PF", payslip.deductions?.employeePf],
              ["Employee ESI", payslip.deductions?.employeeEsi],
              ["Professional tax", payslip.deductions?.professionalTax],
              ["Income tax / TDS", payslip.deductions?.tds],
              ["Voluntary PF", payslip.deductions?.voluntaryPf],
              ["Other deductions", payslip.deductions?.other],
            ]}
            totalLabel="Total deductions"
            total={payslip.totalDeductions}
          />
        </div>

        {/* Net pay is the number people open a payslip to see */}
        <section className="mt-7 flex items-center justify-between rounded-xl2 bg-ink px-6 py-5 text-white">
          <span className="text-sm text-white/60">Net salary</span>
          <strong className="font-display text-3xl font-semibold tabular-nums">
            {formatMoney(payslip.netPay)}
          </strong>
        </section>

        <section className="mt-7">
          <h3 className="mb-3 text-base font-semibold">
            Employer contributions
          </h3>

          <div className="overflow-hidden rounded-xl border border-line">
            <div className="flex justify-between border-b border-line px-4 py-2.5 text-sm">
              <span className="text-slate">Employer PF</span>
              <span className="tabular-nums">
                {formatMoney(payslip.employerContributions?.employerPf)}
              </span>
            </div>
            <div className="flex justify-between border-b border-line px-4 py-2.5 text-sm">
              <span className="text-slate">Employer ESI</span>
              <span className="tabular-nums">
                {formatMoney(payslip.employerContributions?.employerEsi)}
              </span>
            </div>
            <div className="flex justify-between bg-canvas px-4 py-3 text-sm font-semibold">
              <span>Employer cost</span>
              <span className="tabular-nums">
                {formatMoney(payslip.employerCost)}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-7 border-t border-line pt-6">
          <h3 className="mb-3 text-base font-semibold">
            Payroll information
          </h3>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Detail label="Payroll status" value={payslip.status} />
            <Detail
              label="Rule version"
              value={payslip.statutoryRuleVersion}
            />
            <Detail
              label="Calculated"
              value={formatDate(payslip.calculatedAt)}
            />
            <Detail
              label="Approved"
              value={formatDate(payslip.approvedAt)}
            />
            <Detail
              label="Taxable income"
              value={formatMoney(payslip.taxableIncome)}
            />
            <Detail
              label="Loss of pay days"
              value={payslip.lossOfPayDays}
            />
          </div>
        </section>

        <footer className="mt-8 border-t border-line pt-5 text-xs text-slate">
          <p>This payslip is generated internally by PeopleFlow.</p>
          <p className="mt-1">
            No employee payroll data is automatically transmitted to any
            external or government system.
          </p>
        </footer>
      </div>
    </div>
  );
}