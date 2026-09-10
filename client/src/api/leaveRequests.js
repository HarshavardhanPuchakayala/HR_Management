import api from "./axios.js";

export const createLeaveRequest = async (data) => {
  const response = await api.post("/leave-requests", data);
  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await api.get("/leave-requests/my");
  return response.data;
};

export const getTeamLeaveRequests = async () => {
  const response = await api.get("/leave-requests/team");
  return response.data;
};

export const getAllLeaveRequests = async (status) => {
  const params = status ? { status } : {};

  const response = await api.get("/leave-requests", {
    params,
  });

  return response.data;
};

export const approveOrRejectLeaveRequest = async (id, status) => {
  const response = await api.put(`/leave-requests/${id}`, {
    status,
  });
  return response.data;
};