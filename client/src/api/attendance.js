import api from "./axios.js";

export const checkIn = async () => {
  const response = await api.post("/attendance/check-in");
  return response.data;
};

export const checkOut = async () => {
  const response = await api.post("/attendance/check-out");
  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get("/attendance/my");
  return response.data;
};

export const getEmployeeAttendance = async (employeeId) => {
  const response = await api.get(
    `/attendance/employee/${employeeId}`
  );

  return response.data;
};

export const getAllAttendance = async (startDate, endDate) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const response = await api.get("/attendance", {
    params,
  });

  return response.data;
};