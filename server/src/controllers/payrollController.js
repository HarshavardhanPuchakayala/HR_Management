
import mongoose from "mongoose";

import Employee from "../models/Employee.js";
import Compensation from "../models/Compensation.js";
import PayrollProfile from "../models/PayrollProfile.js";
import PayrollRule from "../models/PayrollRule.js";
import PayrollRun from "../models/PayrollRun.js";

import {
  calculatePayroll,
} from "../services/payroll/payrollcalculator.js";

import {
  calculatePayrollTds,
  updatePayrollYtd,
} from "../services/payroll/payrollYtd.js";

import { createAuditLog } from "../utils/auditLog.js";

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const isValidYear = (year) =>
  Number.isInteger(year) &&
  year >= 2020 &&
  year <= 2100;

const getPeriod = (month, year) => {
  const periodStart = new Date(
    year,
    month - 1,
    1
  );

  const periodEnd = new Date(
    year,
    month,
    0
  );

  return {
    periodStart,
    periodEnd,
  };
};

const getActiveCompensation = async (
  employeeId,
  payrollDate,
  session = null
) => {
  const query = Compensation.findOne({
    employeeId,
    status: "active",

    effectiveFrom: {
      $lte: payrollDate,
    },

    $or: [
      {
        effectiveTo: null,
      },
      {
        effectiveTo: {
          $gte: payrollDate,
        },
      },
    ],
  }).sort({
    effectiveFrom: -1,
  });

  if (session) {
    query.session(session);
  }

  return query;
};

const getPayrollRule = async (
  payrollDate,
  session = null
) => {
  const query = PayrollRule.findOne({
    country: "IN",
    state: "TS",

    effectiveFrom: {
      $lte: payrollDate,
    },

    $or: [
      {
        effectiveTo: null,
      },
      {
        effectiveTo: {
          $gte: payrollDate,
        },
      },
    ],
  }).sort({
    effectiveFrom: -1,
  });

  if (session) {
    query.session(session);
  }

  return query;
};

const buildPayroll = async ({
  employeeId,
  month,
  year,
  workingDays,
  paidDays,
  session = null,
}) => {
  const payrollDate = new Date(
    year,
    month - 1,
    1
  );

  const profileQuery =
    PayrollProfile.findOne({
      employeeId,
      status: "active",
    });

  if (session) {
    profileQuery.session(session);
  }

  const [
    profile,
    compensation,
    payrollRule,
  ] = await Promise.all([
    profileQuery,

    getActiveCompensation(
      employeeId,
      payrollDate,
      session
    ),

    getPayrollRule(
      payrollDate,
      session
    ),
  ]);

  if (!profile) {
    throw new Error(
      "Payroll profile not found"
    );
  }

  if (!compensation) {
    throw new Error(
      "Active compensation not found"
    );
  }

  if (!payrollRule) {
    throw new Error(
      "Payroll rule not found"
    );
  }

  const result = calculatePayroll({
    compensation,
    profile,
    payrollRule,
    workingDays,
    paidDays,
  });

  const tax = await calculatePayrollTds({
    employeeId,
    payrollMonth: month,
    payrollYear: year,
    currentGrossPay:
      result.grossPay,
    profile,
    payrollRule,
  });

  result.deductions.tds =
    tax.currentMonthTds;

  result.totalDeductions =
    Object.values(
      result.deductions
    ).reduce(
      (total, value) =>
        total + Number(value || 0),
      0
    );

  result.totalDeductions =
    Math.round(
      (result.totalDeductions +
        Number.EPSILON) *
        100
    ) / 100;

  result.netPay =
    Math.round(
      Math.max(
        0,
        result.grossPay -
          result.totalDeductions
      ) * 100
    ) / 100;

  result.taxableIncome =
    tax.annualTaxableIncome;

  result.statutoryBreakdown = {
    ...result.statutoryBreakdown,

    incomeTax: {
      taxYear: tax.taxYear,

      projectedAnnualGross:
        tax.projectedAnnualGross,

      annualTaxableIncome:
        tax.annualTaxableIncome,

      annualTax:
        tax.annualTax,

      previousTds:
        tax.previousTds,

      previousEmployerTds:
        tax.previousEmployerTds,

      remainingAnnualTax:
        tax.remainingAnnualTax,

      currentMonthTds:
        tax.currentMonthTds,
    },
  };

  return {
    result,
    profile,
    payrollRule,
    compensation,
  };
};

const getPayrollErrorMessage = (
  error
) => {
  const knownErrors = new Set([
    "Payroll profile not found",
    "Active compensation not found",
    "Payroll rule not found",
  ]);

  if (
    knownErrors.has(error?.message)
  ) {
    return error.message;
  }

  if (
    error?.name ===
    "ValidationError"
  ) {
    return "Invalid payroll data";
  }

  return "Payroll calculation failed";
};

export const calculateEmployeePayroll =
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      const { employeeId } =
        req.params;

      const {
        month,
        year,
        workingDays,
        paidDays,
      } = req.body;

      if (
        !isValidObjectId(employeeId)
      ) {
        return res.status(400).json({
          message:
            "Invalid employee ID",
        });
      }

      const payrollMonth =
        Number(month);

      const payrollYear =
        Number(year);

      const totalWorkingDays =
        Number(workingDays);

      const totalPaidDays =
        Number(paidDays);

      if (
        !Number.isInteger(
          payrollMonth
        ) ||
        payrollMonth < 1 ||
        payrollMonth > 12
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll month",
        });
      }

      if (
        !isValidYear(
          payrollYear
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll year",
        });
      }

      if (
        !Number.isFinite(
          totalWorkingDays
        ) ||
        totalWorkingDays <= 0
      ) {
        return res.status(400).json({
          message:
            "Working days must be greater than zero",
        });
      }

      if (
        !Number.isFinite(
          totalPaidDays
        ) ||
        totalPaidDays < 0 ||
        totalPaidDays >
          totalWorkingDays
      ) {
        return res.status(400).json({
          message:
            "Paid days must be between 0 and working days",
        });
      }

      const existing =
        await PayrollRun.findOne({
          employeeId,
          payrollMonth,
          payrollYear,
        });

      if (existing) {
        return res.status(409).json({
          message:
            "Payroll already exists for this employee and month",
          payroll: existing,
        });
      }

      const employee =
        await Employee.findById(
          employeeId
        );

      if (!employee) {
        return res.status(404).json({
          message:
            "Employee not found",
        });
      }

      if (
        employee.status ===
        "inactive"
      ) {
        return res.status(400).json({
          message:
            "Cannot calculate payroll for an inactive employee",
        });
      }

      let createdPayroll;

      await session.withTransaction(
        async () => {
          const {
            result,
            profile,
            payrollRule,
          } = await buildPayroll({
            employeeId,
            month: payrollMonth,
            year: payrollYear,
            workingDays:
              totalWorkingDays,
            paidDays:
              totalPaidDays,
            session,
          });

          const {
            periodStart,
            periodEnd,
          } = getPeriod(
            payrollMonth,
            payrollYear
          );

          const created =
            await PayrollRun.create(
              [
                {
                  employeeId,

                  payrollMonth,

                  payrollYear,

                  periodStart,

                  periodEnd,

                  workingDays:
                    result.workingDays,

                  paidDays:
                    result.paidDays,

                  lossOfPayDays:
                    result.lossOfPayDays,

                  earnings:
                    result.earnings,

                  grossPay:
                    result.grossPay,

                  taxableIncome:
                    result.taxableIncome,

                  deductions:
                    result.deductions,

                  totalDeductions:
                    result.totalDeductions,

                  netPay:
                    result.netPay,

                  employerContributions:
                    result.employerContributions,

                  employerCost:
                    result.employerCost,

                  statutoryBreakdown:
                    result.statutoryBreakdown,

                  statutoryRuleVersion:
                    payrollRule.version,

                  status:
                    "calculated",

                  calculatedAt:
                    new Date(),
                },
              ],
              { session }
            );

          createdPayroll =
            created[0];

          // IMPORTANT:
          // Use result.taxableIncome instead of result.grossPay.
          await updatePayrollYtd({
            employeeId,

            payrollMonth,

            payrollYear,

            grossPay:
              result.grossPay,

            taxableIncome:
              result.taxableIncome,

            tds:
              result.deductions.tds,

            taxRegime:
              profile.taxRegime,

            session,
          });
        }
      );

      await createAuditLog({
        req,

        action:
          "PAYROLL_CALCULATED",

        entityType:
          "PayrollRun",

        entityId:
          createdPayroll._id,
      });

      return res.status(201).json({
        message:
          "Payroll calculated successfully",

        payroll:
          createdPayroll,
      });
    } catch (error) {
      console.error(
        "Calculate payroll error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          message:
            "Payroll already exists for this employee and month",
        });
      }

      if (
        error?.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll data",
        });
      }

      if (
        [
          "Payroll profile not found",
          "Active compensation not found",
          "Payroll rule not found",
        ].includes(
          error?.message
        )
      ) {
        return res.status(400).json({
          message:
            error.message,
        });
      }

      return res.status(500).json({
        message:
          "Failed to calculate payroll",
      });
    } finally {
      await session.endSession();
    }
  };

export const calculateBulkPayroll =
  async (req, res) => {
    const {
      month,
      year,
      workingDays,
      paidDays,
    } = req.body;

    const payrollMonth =
      Number(month);

    const payrollYear =
      Number(year);

    const totalWorkingDays =
      Number(workingDays);

    const totalPaidDays =
      Number(paidDays);

    if (
      !Number.isInteger(
        payrollMonth
      ) ||
      payrollMonth < 1 ||
      payrollMonth > 12
    ) {
      return res.status(400).json({
        message:
          "Invalid payroll month",
      });
    }

    if (
      !isValidYear(
        payrollYear
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid payroll year",
      });
    }

    if (
      !Number.isFinite(
        totalWorkingDays
      ) ||
      totalWorkingDays <= 0
    ) {
      return res.status(400).json({
        message:
          "Working days must be greater than zero",
      });
    }

    if (
      !Number.isFinite(
        totalPaidDays
      ) ||
      totalPaidDays < 0 ||
      totalPaidDays >
        totalWorkingDays
    ) {
      return res.status(400).json({
        message:
          "Paid days must be between 0 and working days",
      });
    }

    try {
      const employees =
        await Employee.find({
          status: "active",
        })
          .select(
            "_id name email department jobTitle"
          )
          .sort({
            name: 1,
          })
          .lean();

      const results = {
        totalEmployees:
          employees.length,

        calculated: 0,

        skipped: 0,

        failed: 0,

        payrolls: [],

        errors: [],
      };

      for (const employee of employees) {
        const session =
          await mongoose.startSession();

        try {
          let createdPayroll = null;

          await session.withTransaction(
            async () => {
              const existing =
                await PayrollRun.findOne({
                  employeeId:
                    employee._id,

                  payrollMonth,

                  payrollYear,
                })
                  .session(session)
                  .lean();

              if (existing) {
                throw new Error(
                  "__PAYROLL_EXISTS__"
                );
              }

              const {
                result,
                profile,
                payrollRule,
              } = await buildPayroll({
                employeeId:
                  employee._id,

                month:
                  payrollMonth,

                year:
                  payrollYear,

                workingDays:
                  totalWorkingDays,

                paidDays:
                  totalPaidDays,

                session,
              });

              const {
                periodStart,
                periodEnd,
              } = getPeriod(
                payrollMonth,
                payrollYear
              );

              const created =
                await PayrollRun.create(
                  [
                    {
                      employeeId:
                        employee._id,

                      payrollMonth,

                      payrollYear,

                      periodStart,

                      periodEnd,

                      workingDays:
                        result.workingDays,

                      paidDays:
                        result.paidDays,

                      lossOfPayDays:
                        result.lossOfPayDays,

                      earnings:
                        result.earnings,

                      grossPay:
                        result.grossPay,

                      taxableIncome:
                        result.taxableIncome,

                      deductions:
                        result.deductions,

                      totalDeductions:
                        result.totalDeductions,

                      netPay:
                        result.netPay,

                      employerContributions:
                        result.employerContributions,

                      employerCost:
                        result.employerCost,

                      statutoryBreakdown:
                        result.statutoryBreakdown,

                      statutoryRuleVersion:
                        payrollRule.version,

                      status:
                        "calculated",

                      calculatedAt:
                        new Date(),
                    },
                  ],
                  { session }
                );

              createdPayroll =
                created[0];

              // IMPORTANT:
              // Use result.taxableIncome instead of result.grossPay.
              await updatePayrollYtd({
                employeeId:
                  employee._id,

                payrollMonth,

                payrollYear,

                grossPay:
                  result.grossPay,

                taxableIncome:
                  result.taxableIncome,

                tds:
                  result.deductions.tds,

                taxRegime:
                  profile.taxRegime,

                session,
              });
            }
          );

          results.calculated += 1;

          await createAuditLog({
            req,

            action:
              "PAYROLL_CALCULATED",

            entityType:
              "PayrollRun",

            entityId:
              createdPayroll._id,
          });

          results.payrolls.push({
            employeeId:
              employee._id,

            employeeName:
              employee.name,

            payrollRunId:
              createdPayroll._id,

            grossPay:
              createdPayroll.grossPay,

            totalDeductions:
              createdPayroll.totalDeductions,

            netPay:
              createdPayroll.netPay,

            status:
              createdPayroll.status,
          });
        } catch (error) {
          if (
            error?.message ===
            "__PAYROLL_EXISTS__"
          ) {
            results.skipped += 1;

            results.errors.push({
              employeeId:
                employee._id,

              employeeName:
                employee.name,

              status:
                "skipped",

              message:
                "Payroll already exists for this month",
            });
          } else {
            results.failed += 1;

            results.errors.push({
              employeeId:
                employee._id,

              employeeName:
                employee.name,

              status:
                "failed",

              message:
                getPayrollErrorMessage(
                  error
                ),
            });
          }
        } finally {
          await session.endSession();
        }
      }

      return res.status(200).json({
        message:
          "Bulk payroll processing completed",

        month:
          payrollMonth,

        year:
          payrollYear,

        results,
      });
    } catch (error) {
      console.error(
        "Bulk payroll error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to process bulk payroll",
      });
    }
  };

export const getPayrollRuns =
  async (req, res) => {
    try {
      const filter = {};

      if (
        req.query.year !==
        undefined
      ) {
        const year =
          Number(req.query.year);

        if (
          !isValidYear(year)
        ) {
          return res.status(400).json({
            message:
              "Invalid payroll year",
          });
        }

        filter.payrollYear =
          year;
      }

      if (
        req.query.month !==
        undefined
      ) {
        const month =
          Number(req.query.month);

        if (
          !Number.isInteger(month) ||
          month < 1 ||
          month > 12
        ) {
          return res.status(400).json({
            message:
              "Invalid payroll month",
          });
        }

        filter.payrollMonth =
          month;
      }

      const payrollRuns =
        await PayrollRun.find(
          filter
        )
          .populate(
            "employeeId",
            "name email department jobTitle"
          )
          .sort({
            payrollYear: -1,

            payrollMonth: -1,

            createdAt: -1,
          });

      return res.json({
        payrollRuns,
      });
    } catch (error) {
      console.error(
        "Get payroll runs error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch payroll runs",
      });
    }
  };

export const getPayrollRunById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll run ID",
        });
      }

      const payroll =
        await PayrollRun.findById(id)
          .populate(
            "employeeId",
            "name email department jobTitle"
          )
          .populate(
            "approvedBy",
            "email role"
          );

      if (!payroll) {
        return res.status(404).json({
          message:
            "Payroll run not found",
        });
      }

      return res.json({
        payroll,
      });
    } catch (error) {
      console.error(
        "Get payroll run error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch payroll",
      });
    }
  };

export const getPayslip =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll run ID",
        });
      }

      const payrollRun =
        await PayrollRun.findById(id)
          .populate(
            "employeeId",
            "name email department jobTitle"
          )
          .populate(
            "approvedBy",
            "email role"
          );

      if (!payrollRun) {
        return res.status(404).json({
          message:
            "Payroll run not found",
        });
      }

      return res.json({
        payslip:
          payrollRun,
      });
    } catch (error) {
      console.error(
        "Get payslip error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch payslip",
      });
    }
  };

export const approvePayroll =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll run ID",
        });
      }

      const payroll =
        await PayrollRun.findById(id);

      if (!payroll) {
        return res.status(404).json({
          message:
            "Payroll run not found",
        });
      }

      if (
        payroll.status !==
        "calculated"
      ) {
        return res.status(400).json({
          message:
            "Only calculated payroll can be approved",
        });
      }

      payroll.status =
        "approved";

      payroll.approvedAt =
        new Date();

      payroll.approvedBy =
        req.user._id;

      await payroll.save();

      await createAuditLog({
        req,

        action:
          "PAYROLL_APPROVED",

        entityType:
          "PayrollRun",

        entityId:
          payroll._id,
      });

      return res.json({
        message:
          "Payroll approved successfully",

        payroll,
      });
    } catch (error) {
      console.error(
        "Approve payroll error:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          message:
            "Invalid payroll data",
        });
      }

      return res.status(500).json({
        message:
          "Failed to approve payroll",
      });
    }
  };
