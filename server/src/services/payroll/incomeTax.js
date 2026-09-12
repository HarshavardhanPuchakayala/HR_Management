const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const calculateTaxFromSlabs = (
  taxableIncome,
  slabs
) => {
  if (
    taxableIncome <= 0 ||
    !Array.isArray(slabs)
  ) {
    return 0;
  }

  let tax = 0;

  for (const slab of slabs) {
    const lowerLimit = slab.minIncome;
    const upperLimit = slab.maxIncome;

    if (taxableIncome <= lowerLimit) {
      continue;
    }

    const taxableAtThisSlab =
      upperLimit === null
        ? taxableIncome - lowerLimit
        : Math.min(
            taxableIncome,
            upperLimit
          ) - lowerLimit;

    if (taxableAtThisSlab > 0) {
      tax +=
        taxableAtThisSlab * slab.rate;
    }

    if (
      upperLimit !== null &&
      taxableIncome <= upperLimit
    ) {
      break;
    }
  }

  return tax;
};

const applyRebate = ({
  taxableIncome,
  tax,
  rebate,
}) => {
  if (!rebate) {
    return tax;
  }

  if (
    taxableIncome <=
    rebate.incomeLimit
  ) {
    return Math.max(
      0,
      tax - rebate.maximumAmount
    );
  }

  return tax;
};

export const calculateIncomeTax = ({
  annualGrossIncome,
  annualDeductions = 0,
  annualExemptions = 0,
  previousEmployerIncome = 0,
  previousEmployerTds = 0,
  taxRule,
  taxRegime = "new",
}) => {
  if (!taxRule) {
    throw new Error(
      "Income tax rule is required"
    );
  }

  if (
    !["new", "old"].includes(taxRegime)
  ) {
    throw new Error(
      "Invalid tax regime"
    );
  }

  const regime =
    taxRule.regimes?.[taxRegime];

  if (!regime) {
    throw new Error(
      `Tax regime '${taxRegime}' is not configured`
    );
  }

  const annualIncome =
    Number(annualGrossIncome || 0) +
    Number(previousEmployerIncome || 0);

  const totalDeductions =
    Number(annualDeductions || 0);

  const totalExemptions =
    Number(annualExemptions || 0);

  const taxableIncome = Math.max(
    0,
    annualIncome -
      totalDeductions -
      totalExemptions
  );

  const taxBeforeRebate =
    calculateTaxFromSlabs(
      taxableIncome,
      regime.slabs
    );

  const taxAfterRebate =
    applyRebate({
      taxableIncome,
      tax: taxBeforeRebate,
      rebate: regime.rebate,
    });

  const cess =
    taxAfterRebate *
    Number(taxRule.cessRate || 0);

  const totalAnnualTax =
    taxAfterRebate + cess;

  const remainingTax = Math.max(
    0,
    totalAnnualTax -
      Number(previousEmployerTds || 0)
  );

  return {
    taxRegime,

    annualIncome:
      roundMoney(annualIncome),

    annualDeductions:
      roundMoney(totalDeductions),

    annualExemptions:
      roundMoney(totalExemptions),

    taxableIncome:
      roundMoney(taxableIncome),

    taxBeforeRebate:
      roundMoney(taxBeforeRebate),

    rebate:
      roundMoney(
        Math.max(
          0,
          taxBeforeRebate -
            taxAfterRebate
        )
      ),

    taxAfterRebate:
      roundMoney(taxAfterRebate),

    cess: roundMoney(cess),

    totalAnnualTax:
      roundMoney(totalAnnualTax),

    previousEmployerIncome:
      roundMoney(
        Number(previousEmployerIncome || 0)
      ),

    previousEmployerTds:
      roundMoney(
        Number(previousEmployerTds || 0)
      ),

    remainingTax:
      roundMoney(remainingTax),
  };
};

export const calculateMonthlyTds = ({
  annualTax,
  monthsRemaining,
}) => {
  if (monthsRemaining <= 0) {
    throw new Error(
      "Months remaining must be greater than zero"
    );
  }

  return roundMoney(
    Math.max(0, annualTax) /
      monthsRemaining
  );
};