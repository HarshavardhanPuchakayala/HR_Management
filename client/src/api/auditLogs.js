import api from "./axios.js";

export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/audit-logs", { params });
  return response.data;
};