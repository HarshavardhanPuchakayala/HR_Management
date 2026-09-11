import api from "./axios.js";

export const getMyLeaveBalances = async (year) => {
  const params = {};

  if (year) {
    params.year = year;
  }

  const response = await api.get("/leave-balances/my", {
    params,
  });

  return response.data;
};

export const getEmployeeLeaveBalances = async (
  employeeId,
  year
) => {
  const params = {};

  if (year) {
    params.year = year;
  }

  const response = await api.get(
    `/leave-balances/employee/${employeeId}`,
    {
      params,
    }
  );

  return response.data;
};

export const initializeLeaveBalances = async (
  employeeId,
  cycleYear,
  balances
) => {
  const response = await api.post(
    "/leave-balances/initialize",
    {
      employeeId,
      cycleYear,
      balances,
    }
  );

  return response.data;
};

export const adjustLeaveBalance = async (
  id,
  data
) => {
  const response = await api.put(
    `/leave-balances/${id}/adjust`,
    data
  );

  return response.data;
};