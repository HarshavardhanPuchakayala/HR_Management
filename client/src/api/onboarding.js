import api from "./axios.js";

export const getOnboardingTemplates = async () => {
  const response = await api.get("/onboarding/templates");
  return response.data;
};

export const createOnboardingTemplate = async (data) => {
  const response = await api.post("/onboarding/templates", data);
  return response.data;
};

export const assignOnboarding = async (data) => {
  const response = await api.post("/onboarding/assign", data);
  return response.data;
};

export const getMyOnboarding = async () => {
  const response = await api.get("/onboarding/my");
  return response.data;
};

export const getEmployeeOnboarding = async (employeeId) => {
  const response = await api.get(`/onboarding/employee/${employeeId}`);
  return response.data;
};

export const updateOnboardingTask = async (id, data) => {
  const response = await api.put(`/onboarding/tasks/${id}`, data);
  return response.data;
};

export const createOffboarding = async (data) => {
  const response = await api.post("/onboarding/offboarding", data);
  return response.data;
};

export const getOffboardingRecords = async () => {
  const response = await api.get("/onboarding/offboarding");
  return response.data;
};

export const updateOffboarding = async (id, data) => {
  const response = await api.put(`/onboarding/offboarding/${id}`, data);
  return response.data;
};