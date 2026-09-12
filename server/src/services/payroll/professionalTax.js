const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateProfessionalTax = ({
  monthlySalary,
  applicable,
  rule,
}) => {
  if (!applicable) {
    return {
      taxableSalary: 0,
      tax: 0,
    };
  }

  if (!rule) {
    throw new Error(
      "Professional tax rule is required"
    );
  }

  if (!rule.enabled) {
    return {
      taxableSalary: 0,
      tax: 0,
    };
  }

  const salary = Math.max(
    0,
    Number(monthlySalary || 0)
  );

  const slabs = Array.isArray(
    rule.slabs
  )
    ? rule.slabs
    : [];

  const slab = slabs.find((item) => {
    const minimum =
      Number(item.minMonthlySalary || 0);

    const maximum =
      item.maxMonthlySalary === null ||
      item.maxMonthlySalary === undefined
        ? null
        : Number(item.maxMonthlySalary);

    if (salary < minimum) {
      return false;
    }

    if (maximum === null) {
      return true;
    }

    return salary <= maximum;
  });

  return {
    taxableSalary: roundMoney(salary),

    tax: roundMoney(
      slab?.monthlyTax || 0
    ),
  };
};