import api from "./axios.js";

export const getDashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};