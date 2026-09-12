import api from "./axios.js";

export const getPayrollRuns = async (
  params = {}
) => {
  const response = await api.get(
    "/payroll",
    { params }
  );

  return response.data;
};

export const getPayrollRun = async (id) => {
  const response = await api.get(
    `/payroll/${id}`
  );

  return response.data;
};

export const getPayslip = async (id) => {
  const response = await api.get(
    `/payroll/${id}/payslip`
  );

  return response.data;
};

export const calculatePayroll = async (
  employeeId,
  data
) => {
  const response = await api.post(
    `/payroll/employee/${employeeId}/calculate`,
    data
  );

  return response.data;
};

export const calculateBulkPayroll =
  async (data) => {
    const response = await api.post(
      "/payroll/bulk/calculate",
      data
    );

    return response.data;
  };

export const approvePayroll = async (
  id
) => {
  const response = await api.put(
    `/payroll/${id}/approve`
  );

  return response.data;
};