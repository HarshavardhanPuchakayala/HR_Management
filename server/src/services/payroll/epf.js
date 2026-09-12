const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateEpf = ({
  basicWages,
  applicable,
  rule,
}) => {
  if (!applicable) {
    return {
      pfWages: 0,
      employeeContribution: 0,
      employerContribution: 0,
      pensionContribution: 0,
      employerEpfContribution: 0,
    };
  }

  if (!rule) {
    throw new Error(
      "EPF rule is required"
    );
  }

  const wages = Math.max(
    0,
    Number(basicWages || 0)
  );

  const wageCeiling = Number(
    rule.wageCeiling || wages
  );

  const pfWages = Math.min(
    wages,
    wageCeiling
  );

  const employeeContribution =
    pfWages *
    Number(rule.employeeRate || 0);

  const employerContribution =
    pfWages *
    Number(rule.employerRate || 0);

  /*
   * EPS is normally calculated at the
   * statutory pension contribution rate.
   *
   * Never allow EPS to exceed the employer
   * contribution.
   */
  const pensionContribution = Math.min(
    employerContribution,
    pfWages *
      Number(rule.pensionRate || 0)
  );

  const employerEpfContribution =
    Math.max(
      0,
      employerContribution -
        pensionContribution
    );

  return {
    pfWages: roundMoney(pfWages),

    employeeContribution:
      roundMoney(
        employeeContribution
      ),

    employerContribution:
      roundMoney(
        employerContribution
      ),

    pensionContribution:
      roundMoney(
        pensionContribution
      ),

    employerEpfContribution:
      roundMoney(
        employerEpfContribution
      ),
  };
};