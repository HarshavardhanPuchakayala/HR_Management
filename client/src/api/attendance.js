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