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

/*
 * Self-service profile — added for the "me" endpoints.
 * NOTE: your backend's PATCH /employees/me was deliberately built
 * phone-only. If you want name editable too, the backend needs to accept
 * it there first, or this will fail/ignore it. Verify with a real request
 * before trusting this.
 */
export const getMyProfile = async () => {
  const response = await api.get("/employees/me");
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await api.patch("/employees/me", data);
  return response.data;
};

/*
 * NOTE: the controller behind this moved to authController.js this
 * session (per your own account). This URL path is unverified against
 * the current backend router — test it for real before relying on it.
 */
export const changePassword = async (
  currentPassword,
  newPassword
) => {
  const response = await api.post(
    "/employees/change-password",
    {
      currentPassword,
      newPassword,
    }
  );

  return response.data;
};

export const resetEmployeePassword = async (employeeId) => {
  const response = await api.post(
    `/employees/${employeeId}/reset-password`
  );

  return response.data;
};