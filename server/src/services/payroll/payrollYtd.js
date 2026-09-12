import PayrollYtd from "../../models/PayrollYtd.js";
import {
  calculateIncomeTax,
  calculateMonthlyTds,
} from "./incomeTax.js";

const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) /
  100;

export const getTaxYear = (month, year) => {
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
};

export const getTaxYearMonthNumber = (month) => {
  if (month >= 4) {
    return month - 3;
  }

  return month + 9;
};

export const getMonthsRemaining = (month) => {
  const taxYearMonth = getTaxYearMonthNumber(month);

  return Math.max(
    1,
    12 - taxYearMonth + 1
  );
};

export const calculatePayrollTds = async ({
  employeeId,
  payrollMonth,
  payrollYear,
  currentGrossPay,
  profile,
  payrollRule,
}) => {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  const taxYear = getTaxYear(
    payrollMonth,
    payrollYear
  );

  const ytd = await PayrollYtd.findOne({
    employeeId,
    taxYear,
  }).lean();

  const previousGrossIncome = roundMoney(
    ytd?.grossIncomeYtd
  );

  const previousTds = roundMoney(
    ytd?.tdsDeductedYtd
  );

  const previousEmployerIncome = roundMoney(
    ytd?.previousEmployerIncome
  );

  const previousEmployerTds = roundMoney(
    ytd?.previousEmployerTds
  );

  const currentGross = roundMoney(
    currentGrossPay
  );

  const taxYearMonth =
    getTaxYearMonthNumber(payrollMonth);

  const monthsRemaining =
    getMonthsRemaining(payrollMonth);

  const futureMonths = Math.max(
    0,
    12 - taxYearMonth
  );

  const projectedFutureIncome = roundMoney(
    currentGross * futureMonths
  );

  const projectedAnnualGross = roundMoney(
    previousGrossIncome +
      currentGross +
      projectedFutureIncome
  );

  const standardDeduction = Number(
    payrollRule.incomeTax?.regimes?.[
      profile.taxRegime
    ]?.standardDeduction || 0
  );

  const taxCalculation = calculateIncomeTax({
    annualGrossIncome: projectedAnnualGross,
    annualDeductions: standardDeduction,
    annualExemptions: 0,
    previousEmployerIncome,
    previousEmployerTds,
    taxRule: payrollRule.incomeTax,
    taxRegime: profile.taxRegime,
  });

  const taxAlreadyDeducted = roundMoney(
    previousTds + previousEmployerTds
  );

  const remainingAnnualTax = roundMoney(
    Math.max(
      0,
      taxCalculation.totalAnnualTax -
        taxAlreadyDeducted
    )
  );

  const monthlyTds = calculateMonthlyTds({
    annualTax: remainingAnnualTax,
    monthsRemaining,
  });

  return {
    taxYear,
    taxYearMonth,
    monthsRemaining,
    projectedAnnualGross,
    annualTaxableIncome:
      taxCalculation.taxableIncome,
    annualTax:
      taxCalculation.totalAnnualTax,
    previousTds,
    previousEmployerTds,
    remainingAnnualTax,
    currentMonthTds: roundMoney(
      profile.tdsApplicable
        ? monthlyTds
        : 0
    ),
  };
};

export const updatePayrollYtd = async ({
  employeeId,
  payrollMonth,
  payrollYear,
  grossPay,
  taxableIncome,
  tds,
  taxRegime,
  session = null,
}) => {
  const taxYear = getTaxYear(
    payrollMonth,
    payrollYear
  );

  const ytdMonth =
    getTaxYearMonthNumber(payrollMonth);

  const query = PayrollYtd.findOne({
    employeeId,
    taxYear,
  });

  if (session) {
    query.session(session);
  }

  const existing = await query;

  if (!existing) {
    const created = await PayrollYtd.create(
      [
        {
          employeeId,
          taxYear,
          taxRegime,
          grossIncomeYtd: roundMoney(grossPay),
          taxableIncomeYtd:
            roundMoney(taxableIncome),
          tdsDeductedYtd: roundMoney(tds),
          lastProcessedMonth: ytdMonth,
        },
      ],
      session ? { session } : undefined
    );

    return created[0];
  }

  existing.grossIncomeYtd = roundMoney(
    existing.grossIncomeYtd + grossPay
  );

  existing.taxableIncomeYtd = roundMoney(
    existing.taxableIncomeYtd +
      taxableIncome
  );

  existing.tdsDeductedYtd = roundMoney(
    existing.tdsDeductedYtd + tds
  );

  existing.taxRegime = taxRegime;
  existing.lastProcessedMonth = ytdMonth;

  await existing.save(
    session ? { session } : undefined
  );

  return existing;
};