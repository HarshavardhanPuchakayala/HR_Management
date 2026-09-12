import api from "./axios.js";

export const uploadDocument = async (data) => {
  const response = await api.post("/documents", data);
  return response.data;
};

export const getMyDocuments = async () => {
  const response = await api.get("/documents/my");
  return response.data;
};

export const getEmployeeDocuments = async (employeeId) => {
  const response = await api.get(`/documents/employee/${employeeId}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};