import api from "./axios.js";

export const createLeaveRequest = async (data) => {
  const response = await api.post("/leave", data);
  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await api.get("/leave/my");
  return response.data;
};

export const getTeamLeaveRequests = async () => {
  const response = await api.get("/leave/team");
  return response.data;
};

export const getAllLeaveRequests = async (status) => {
  const params = status ? { status } : {};

  const response = await api.get("/leave", {
    params,
  });

  return response.data;
};

export const approveOrRejectLeaveRequest = async (
  id,
  status
) => {
  const response = await api.put(
    `/leave/${id}`,
    { status }
  );

  return response.data;
};

export const cancelLeaveRequest = async (id) => {
  const response = await api.patch(
    `/leave/${id}/cancel`
  );

  return response.data;
};