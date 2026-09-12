const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateEsi = ({
  grossWages,
  applicable,
  rule,
}) => {
  if (!applicable) {
    return {
      esiWages: 0,
      employeeContribution: 0,
      employerContribution: 0,
    };
  }

  if (!rule) {
    throw new Error(
      "ESI rule is required"
    );
  }

  const wages = Math.max(
    0,
    Number(grossWages || 0)
  );

  const wageCeiling = Number(
    rule.wageCeiling || 0
  );

  /*
   * ESI coverage is determined using the
   * applicable statutory wage ceiling.
   */
  if (
    wageCeiling > 0 &&
    wages > wageCeiling
  ) {
    return {
      esiWages: 0,
      employeeContribution: 0,
      employerContribution: 0,
    };
  }

  const employeeContribution =
    wages *
    Number(rule.employeeRate || 0);

  const employerContribution =
    wages *
    Number(rule.employerRate || 0);

  return {
    esiWages: roundMoney(wages),

    employeeContribution:
      roundMoney(
        employeeContribution
      ),

    employerContribution:
      roundMoney(
        employerContribution
      ),
  };
};