import api from "./axios.js";

export const getReviewCycles = async () => {
  const response = await api.get("/performance-reviews/cycles");
  return response.data;
};

export const createReviewCycle = async (data) => {
  const response = await api.post(
    "/performance-reviews/cycles",
    data
  );

  return response.data;
};

export const activateReviewCycle = async (id) => {
  const response = await api.put(
    `/performance-reviews/cycles/${id}/activate`
  );

  return response.data;
};

export const completeReviewCycle = async (id) => {
  const response = await api.put(
    `/performance-reviews/cycles/${id}/complete`
  );

  return response.data;
};

export const createPerformanceReview = async (data) => {
  const response = await api.post(
    "/performance-reviews",
    data
  );

  return response.data;
};

export const getMyPerformanceReviews = async () => {
  const response = await api.get(
    "/performance-reviews/my"
  );

  return response.data;
};

export const getTeamPerformanceReviews = async () => {
  const response = await api.get(
    "/performance-reviews/team"
  );

  return response.data;
};

export const getAllPerformanceReviews = async () => {
  const response = await api.get(
    "/performance-reviews/all"
  );

  return response.data;
};

export const updatePerformanceReview = async (
  id,
  data
) => {
  const response = await api.put(
    `/performance-reviews/${id}`,
    data
  );

  return response.data;
};

export const submitPerformanceReview = async (id) => {
  const response = await api.post(
    `/performance-reviews/${id}/submit`
  );

  return response.data;
};