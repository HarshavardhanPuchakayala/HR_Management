
import { calculateEpf } from "./epf.js";
import { calculateEsi } from "./esi.js";
import { calculateProfessionalTax } from "./professionalTax.js";

const roundMoney = (value) =>
  Math.round(
    (Number(value || 0) + Number.EPSILON) * 100
  ) / 100;

const calculateProratedAmount = ({
  amount,
  paidDays,
  workingDays,
}) => {
  const value = Number(amount || 0);

  if (workingDays <= 0) {
    throw new Error(
      "Working days must be greater than zero"
    );
  }

  return roundMoney(
    (value / workingDays) * paidDays
  );
};

export const calculatePayroll = ({
  compensation,
  profile,
  payrollRule,
  workingDays,
  paidDays,
  arrears = 0,
  reimbursements = 0,
  otherDeductions = 0,
}) => {
  if (!compensation) {
    throw new Error("Compensation is required");
  }

  if (!profile) {
    throw new Error(
      "Payroll profile is required"
    );
  }

  if (!payrollRule) {
    throw new Error("Payroll rule is required");
  }

  const totalWorkingDays = Number(workingDays);
  const totalPaidDays = Number(paidDays);

  if (
    !Number.isFinite(totalWorkingDays) ||
    totalWorkingDays <= 0
  ) {
    throw new Error(
      "Working days must be greater than zero"
    );
  }

  if (
    !Number.isFinite(totalPaidDays) ||
    totalPaidDays < 0 ||
    totalPaidDays > totalWorkingDays
  ) {
    throw new Error(
      "Paid days must be between 0 and working days"
    );
  }

  const lossOfPayDays = roundMoney(
    totalWorkingDays - totalPaidDays
  );

  // Annual salary components are converted to monthly.
  const monthlyMultiplier =
    compensation.salaryType === "annual"
      ? 1 / 12
      : 1;

  const prorate = (amount) =>
    calculateProratedAmount({
      amount:
        Number(amount || 0) * monthlyMultiplier,
      paidDays: totalPaidDays,
      workingDays: totalWorkingDays,
    });

  const earnings = {
    basic: prorate(compensation.basic),

    hra: prorate(compensation.hra),

    specialAllowance: prorate(
      compensation.specialAllowance
    ),

    conveyanceAllowance: prorate(
      compensation.conveyanceAllowance
    ),

    medicalAllowance: prorate(
      compensation.medicalAllowance
    ),

    otherAllowance: prorate(
      compensation.otherAllowance
    ),

    // Bonus is treated as a one-time payment.
    bonus: roundMoney(
      Number(compensation.bonus || 0)
    ),

    overtime: roundMoney(
      Number(compensation.overtimeRate || 0) *
        Number(compensation.overtimeHours || 0)
    ),

    arrears: roundMoney(arrears),

    reimbursements:
      roundMoney(reimbursements),
  };

  const grossPay = roundMoney(
    Object.values(earnings).reduce(
      (total, value) =>
        total + Number(value || 0),
      0
    )
  );

  // EPF
  const epf = calculateEpf({
    basicWages: earnings.basic,
    applicable: profile.pfApplicable,
    rule: payrollRule.epf,
  });

  // ESI
  const esi = calculateEsi({
    grossWages: grossPay,
    applicable: profile.esiApplicable,
    rule: payrollRule.esi,
  });

  // Professional Tax
  const professionalTax =
    calculateProfessionalTax({
      monthlySalary: grossPay,
      applicable:
        profile.professionalTaxApplicable,
      rule: payrollRule.professionalTax,
    });

  // Voluntary PF
  const voluntaryPf = roundMoney(
    Number(
      profile.voluntaryPfContribution || 0
    )
  );

  const deductions = {
    employeePf:
      epf.employeeContribution,

    employeeEsi:
      esi.employeeContribution,

    professionalTax:
      professionalTax.tax,

    // TDS is calculated later using PayrollYtd.
    tds: 0,

    voluntaryPf,

    other: roundMoney(otherDeductions),
  };

  const totalDeductions = roundMoney(
    Object.values(deductions).reduce(
      (total, value) =>
        total + Number(value || 0),
      0
    )
  );

  const netPay = roundMoney(
    Math.max(
      0,
      grossPay - totalDeductions
    )
  );

  const employerContributions = {
    employerPf:
      epf.employerContribution,

    employerEsi:
      esi.employerContribution,
  };

  const employerCost = roundMoney(
    grossPay +
      employerContributions.employerPf +
      employerContributions.employerEsi
  );

  return {
    workingDays: totalWorkingDays,

    paidDays: totalPaidDays,

    lossOfPayDays,

    earnings,

    grossPay,

    taxableIncome: grossPay,

    deductions,

    totalDeductions,

    netPay,

    employerContributions,

    employerCost,

    statutoryBreakdown: {
      epf: {
        pfWages: epf.pfWages,

        employeeContribution:
          epf.employeeContribution,

        employerContribution:
          epf.employerContribution,

        pensionContribution:
          epf.pensionContribution,

        employerEpfContribution:
          epf.employerEpfContribution,
      },

      esi: {
        esiWages: esi.esiWages,

        employeeContribution:
          esi.employeeContribution,

        employerContribution:
          esi.employerContribution,
      },

      professionalTax: {
        taxableSalary:
          professionalTax.taxableSalary,

        tax: professionalTax.tax,
      },
    },
  };
};
