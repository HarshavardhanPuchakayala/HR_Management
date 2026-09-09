import api from "./axios.js";

export const createLeaveRequest = async (data) => {
  const response = await api.post("/leave-requests", data);
  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await api.get("/leave-requests/my");
  return response.data;
};