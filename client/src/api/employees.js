import api from "./axios.js";

export const getEmployees = async () => {
  const response = await api.get("/employees");
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data) => {
  const response = await api.post("/employees", data);
  return response.data;
};

export const updateEmployee = async (id, data) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const deactivateEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};