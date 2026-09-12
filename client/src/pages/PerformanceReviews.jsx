
import { useEffect, useState } from "react";

import {
  getReviewCycles,
  createReviewCycle,
  activateReviewCycle,
  completeReviewCycle,
  createPerformanceReview,
  getMyPerformanceReviews,
  getTeamPerformanceReviews,
  getAllPerformanceReviews,
  updatePerformanceReview,
  submitPerformanceReview,
} from "../api/performanceReviews.js";

import { getEmployees } from "../api/employees.js";

import { useAuth } from "../context/AuthContext.jsx";

const PerformanceReviews = () => {
  const { user } = useAuth();

  const role = user?.role;

  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [cycleForm, setCycleForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [reviewForm, setReviewForm] = useState({
    cycleId: "",
    employeeId: "",
  });

  const [editingReviewId, setEditingReviewId] =
    useState(null);

  const [editForm, setEditForm] = useState({
    rating: "",
    strengths: "",
    areasForImprovement: "",
    goals: "",
  });

  const [employeeComments, setEmployeeComments] =
    useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const cycleData = await getReviewCycles();

      setCycles(
        Array.isArray(cycleData) ? cycleData : []
      );

      if (role === "admin") {
        const reviewData =
          await getAllPerformanceReviews();

        setReviews(
          Array.isArray(reviewData)
            ? reviewData
            : []
        );
      }

      if (role === "manager") {
        const [reviewData, employeeData] =
          await Promise.all([
            getTeamPerformanceReviews(),
            getEmployees(),
          ]);

        const allEmployees = Array.isArray(
          employeeData
        )
          ? employeeData
          : [];

        /*
         * This filter only controls the UI selection.
         * The backend remains responsible for authorization.
         */
        const directReports = allEmployees.filter(
          (employee) => {
            if (!employee.managerId) {
              return false;
            }

            const managerId =
              typeof employee.managerId === "object"
                ? employee.managerId._id
                : employee.managerId;

            return (
              managerId?.toString() ===
                user.employeeId?.toString() &&
              employee.status === "active"
            );
          }
        );

        setEmployees(directReports);

        setReviews(
          Array.isArray(reviewData)
            ? reviewData
            : []
        );
      }

      if (role === "employee") {
        const reviewData =
          await getMyPerformanceReviews();

        setReviews(
          Array.isArray(reviewData)
            ? reviewData
            : []
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load performance reviews"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      loadData();
    }
  }, [role]);

  const handleCycleChange = (event) => {
    const { name, value } = event.target;

    setCycleForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateCycle = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      await createReviewCycle(cycleForm);

      setCycleForm({
        name: "",
        startDate: "",
        endDate: "",
      });

      setMessage(
        "Review cycle created successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create review cycle"
      );
    }
  };

  const handleActivateCycle = async (id) => {
    try {
      setMessage("");
      setError("");

      await activateReviewCycle(id);

      setMessage("Review cycle activated.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to activate review cycle"
      );
    }
  };

  const handleCompleteCycle = async (id) => {
    try {
      setMessage("");
      setError("");

      await completeReviewCycle(id);

      setMessage("Review cycle completed.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to complete review cycle"
      );
    }
  };

  const handleReviewFormChange = (event) => {
    const { name, value } = event.target;

    setReviewForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      await createPerformanceReview(reviewForm);

      setReviewForm({
        cycleId: "",
        employeeId: "",
      });

      setMessage(
        "Performance review created successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create performance review"
      );
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(review._id);

    setEditForm({
      rating:
        review.rating === null ||
        review.rating === undefined
          ? ""
          : review.rating,
      strengths: review.strengths || "",
      areasForImprovement:
        review.areasForImprovement || "",
      goals: review.goals || "",
    });

    setMessage("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingReviewId(null);

    setEditForm({
      rating: "",
      strengths: "",
      areasForImprovement: "",
      goals: "",
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveReview = async (id) => {
    try {
      setMessage("");
      setError("");

      const payload = {
        strengths: editForm.strengths,
        areasForImprovement:
          editForm.areasForImprovement,
        goals: editForm.goals,
      };

      if (editForm.rating !== "") {
        payload.rating = Number(editForm.rating);
      }

      await updatePerformanceReview(id, payload);

      setMessage(
        "Performance review updated successfully."
      );

      cancelEditing();

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update performance review"
      );
    }
  };

  const handleSubmitReview = async (id) => {
    try {
      setMessage("");
      setError("");

      await submitPerformanceReview(id);

      setMessage(
        "Performance review submitted successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit performance review"
      );
    }
  };

  const handleEmployeeCommentChange = (
    reviewId,
    value
  ) => {
    setEmployeeComments((previous) => ({
      ...previous,
      [reviewId]: value,
    }));
  };

  const handleAcknowledgeReview = async (id) => {
    try {
      setMessage("");
      setError("");

      await updatePerformanceReview(id, {
        employeeComments:
          employeeComments[id] || "",
      });

      setEmployeeComments((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });

      setMessage(
        "Performance review acknowledged successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to acknowledge performance review"
      );
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) {
      return "Unknown employee";
    }

    if (typeof employeeId === "object") {
      return (
        employeeId.name ||
        employeeId.email ||
        "Unknown employee"
      );
    }

    const employee = employees.find(
      (item) =>
        item._id?.toString() ===
        employeeId?.toString()
    );

    return employee?.name || employeeId;
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString();
  };

  const getCycleById = (cycleId) => {
    if (!cycleId) {
      return null;
    }

    const id =
      typeof cycleId === "object"
        ? cycleId._id
        : cycleId;

    return (
      cycles.find(
        (cycle) =>
          cycle._id?.toString() ===
          id?.toString()
      ) || null
    );
  };

  const canManagerEditReview = (review) => {
    const cycle = getCycleById(review.cycleId);

    return (
      review.status === "draft" &&
      cycle?.status === "active"
    );
  };

  if (loading) {
    return (
      <div>
        Loading performance reviews...
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Performance Reviews</h1>

        <p>
          Manage employee performance reviews and
          review cycles.
        </p>
      </header>

      {message && <p>{message}</p>}

      {error && <p>{error}</p>}

      {/* ADMIN */}
      {role === "admin" && (
        <>
          <section>
            <h2>Create Review Cycle</h2>

            <form onSubmit={handleCreateCycle}>
              <div>
                <label htmlFor="cycle-name">
                  Cycle Name
                </label>

                <br />

                <input
                  id="cycle-name"
                  name="name"
                  type="text"
                  value={cycleForm.name}
                  onChange={handleCycleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="cycle-start-date">
                  Start Date
                </label>

                <br />

                <input
                  id="cycle-start-date"
                  name="startDate"
                  type="date"
                  value={cycleForm.startDate}
                  onChange={handleCycleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="cycle-end-date">
                  End Date
                </label>

                <br />

                <input
                  id="cycle-end-date"
                  name="endDate"
                  type="date"
                  value={cycleForm.endDate}
                  onChange={handleCycleChange}
                  required
                />
              </div>

              <br />

              <button type="submit">
                Create Cycle
              </button>
            </form>
          </section>

          <hr />

          <section>
            <h2>Review Cycles</h2>

            {cycles.length === 0 ? (
              <p>No review cycles found.</p>
            ) : (
              cycles.map((cycle) => (
                <div key={cycle._id}>
                  <h3>{cycle.name}</h3>

                  <p>
                    {formatDate(cycle.startDate)}
                    {" - "}
                    {formatDate(cycle.endDate)}
                  </p>

                  <p>
                    Status:{" "}
                    <strong>{cycle.status}</strong>
                  </p>

                  {cycle.status === "draft" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleActivateCycle(
                          cycle._id
                        )
                      }
                    >
                      Activate
                    </button>
                  )}

                  {cycle.status === "active" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCompleteCycle(
                          cycle._id
                        )
                      }
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))
            )}
          </section>

          <hr />

          <section>
            <h2>All Performance Reviews</h2>

            <ReviewList
              reviews={reviews}
              getEmployeeName={getEmployeeName}
              formatDate={formatDate}
            />
          </section>
        </>
      )}

      {/* MANAGER */}
      {role === "manager" && (
        <>
          <section>
            <h2>Create Performance Review</h2>

            {cycles.filter(
              (cycle) => cycle.status === "active"
            ).length === 0 ? (
              <p>
                There are no active review cycles.
              </p>
            ) : employees.length === 0 ? (
              <p>
                You currently have no active direct
                reports available for review.
              </p>
            ) : (
              <form onSubmit={handleCreateReview}>
                <div>
                  <label htmlFor="review-cycle">
                    Review Cycle
                  </label>

                  <br />

                  <select
                    id="review-cycle"
                    name="cycleId"
                    value={reviewForm.cycleId}
                    onChange={handleReviewFormChange}
                    required
                  >
                    <option value="">
                      Select cycle
                    </option>

                    {cycles
                      .filter(
                        (cycle) =>
                          cycle.status === "active"
                      )
                      .map((cycle) => (
                        <option
                          key={cycle._id}
                          value={cycle._id}
                        >
                          {cycle.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="review-employee">
                    Employee
                  </label>

                  <br />

                  <select
                    id="review-employee"
                    name="employeeId"
                    value={reviewForm.employeeId}
                    onChange={handleReviewFormChange}
                    required
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee._id}
                        value={employee._id}
                      >
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <br />

                <button type="submit">
                  Create Review
                </button>
              </form>
            )}
          </section>

          <hr />

          <section>
            <h2>Team Performance Reviews</h2>

            {reviews.length === 0 ? (
              <p>
                No team performance reviews found.
              </p>
            ) : (
              reviews.map((review) => {
                const cycle = getCycleById(
                  review.cycleId
                );

                const managerCanEdit =
                  canManagerEditReview(review);

                return (
                  <div key={review._id}>
                    <h3>
                      {getEmployeeName(
                        review.employeeId
                      )}
                    </h3>

                    <p>
                      Cycle:{" "}
                      {review.cycleId?.name || "-"}
                    </p>

                    <p>
                      Status:{" "}
                      <strong>{review.status}</strong>
                    </p>

                    {cycle?.status ===
                      "completed" &&
                      review.status === "draft" && (
                        <p>
                          This review cannot be edited
                          or submitted because the
                          review cycle is completed.
                        </p>
                      )}

                    {editingReviewId ===
                    review._id ? (
                      <>
                        <div>
                          <label
                            htmlFor={`rating-${review._id}`}
                          >
                            Rating (1-5)
                          </label>

                          <br />

                          <input
                            id={`rating-${review._id}`}
                            name="rating"
                            type="number"
                            min="1"
                            max="5"
                            step="1"
                            value={editForm.rating}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`strengths-${review._id}`}
                          >
                            Strengths
                          </label>

                          <br />

                          <textarea
                            id={`strengths-${review._id}`}
                            name="strengths"
                            value={editForm.strengths}
                            onChange={handleEditChange}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`areas-${review._id}`}
                          >
                            Areas for Improvement
                          </label>

                          <br />

                          <textarea
                            id={`areas-${review._id}`}
                            name="areasForImprovement"
                            value={
                              editForm.areasForImprovement
                            }
                            onChange={handleEditChange}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`goals-${review._id}`}
                          >
                            Goals
                          </label>

                          <br />

                          <textarea
                            id={`goals-${review._id}`}
                            name="goals"
                            value={editForm.goals}
                            onChange={handleEditChange}
                          />
                        </div>

                        <br />

                        <button
                          type="button"
                          onClick={() =>
                            handleSaveReview(
                              review._id
                            )
                          }
                        >
                          Save
                        </button>

                        {" "}

                        <button
                          type="button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <p>
                          Rating:{" "}
                          {review.rating ??
                            "Not rated"}
                        </p>

                        <p>
                          <strong>
                            Strengths:
                          </strong>{" "}
                          {review.strengths || "-"}
                        </p>

                        <p>
                          <strong>
                            Areas for Improvement:
                          </strong>{" "}
                          {review.areasForImprovement ||
                            "-"}
                        </p>

                        <p>
                          <strong>Goals:</strong>{" "}
                          {review.goals || "-"}
                        </p>

                        {managerCanEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  review
                                )
                              }
                            >
                              Edit
                            </button>

                            {" "}

                            <button
                              type="button"
                              onClick={() =>
                                handleSubmitReview(
                                  review._id
                                )
                              }
                            >
                              Submit
                            </button>
                          </>
                        )}

                        {review.status ===
                          "acknowledged" && (
                          <p>
                            Employee acknowledged this
                            review.
                          </p>
                        )}
                      </>
                    )}

                    <hr />
                  </div>
                );
              })
            )}
          </section>
        </>
      )}

      {/* EMPLOYEE */}
      {role === "employee" && (
        <section>
          <h2>My Performance Reviews</h2>

          {reviews.length === 0 ? (
            <p>
              No performance reviews found.
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review._id}>
                <h3>
                  {review.cycleId?.name ||
                    "Performance Review"}
                </h3>

                <p>
                  Status:{" "}
                  <strong>{review.status}</strong>
                </p>

                <p>
                  Rating:{" "}
                  {review.rating ?? "Not rated"}
                </p>

                <p>
                  <strong>
                    Strengths:
                  </strong>{" "}
                  {review.strengths || "-"}
                </p>

                <p>
                  <strong>
                    Areas for Improvement:
                  </strong>{" "}
                  {review.areasForImprovement ||
                    "-"}
                </p>

                <p>
                  <strong>Goals:</strong>{" "}
                  {review.goals || "-"}
                </p>

                {review.status === "submitted" && (
                  <>
                    <label
                      htmlFor={`comment-${review._id}`}
                    >
                      Your Comments
                    </label>

                    <br />

                    <textarea
                      id={`comment-${review._id}`}
                      value={
                        employeeComments[
                          review._id
                        ] || ""
                      }
                      onChange={(event) =>
                        handleEmployeeCommentChange(
                          review._id,
                          event.target.value
                        )
                      }
                      placeholder="Add optional comments..."
                    />

                    <br />

                    <button
                      type="button"
                      onClick={() =>
                        handleAcknowledgeReview(
                          review._id
                        )
                      }
                    >
                      Acknowledge Review
                    </button>
                  </>
                )}

                {review.status ===
                  "acknowledged" && (
                  <p>
                    You acknowledged this review.
                  </p>
                )}

                {review.employeeComments && (
                  <p>
                    <strong>
                      Your Comments:
                    </strong>{" "}
                    {review.employeeComments}
                  </p>
                )}

                <hr />
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
};

const ReviewList = ({
  reviews,
  getEmployeeName,
  formatDate,
}) => {
  if (reviews.length === 0) {
    return (
      <p>
        No performance reviews found.
      </p>
    );
  }

  return (
    <div>
      {reviews.map((review) => (
        <div key={review._id}>
          <h3>
            {getEmployeeName(review.employeeId)}
          </h3>

          <p>
            Cycle:{" "}
            {review.cycleId?.name || "-"}
          </p>

          <p>
            Status:{" "}
            <strong>{review.status}</strong>
          </p>

          <p>
            Rating:{" "}
            {review.rating ?? "Not rated"}
          </p>

          <p>
            <strong>Submitted:</strong>{" "}
            {formatDate(review.submittedAt)}
          </p>

          <p>
            <strong>Acknowledged:</strong>{" "}
            {formatDate(review.acknowledgedAt)}
          </p>

          <p>
            <strong>Strengths:</strong>{" "}
            {review.strengths || "-"}
          </p>

          <p>
            <strong>
              Areas for Improvement:
            </strong>{" "}
            {review.areasForImprovement || "-"}
          </p>

          <p>
            <strong>Goals:</strong>{" "}
            {review.goals || "-"}
          </p>

          {review.employeeComments && (
            <p>
              <strong>
                Employee Comments:
              </strong>{" "}
              {review.employeeComments}
            </p>
          )}

          <hr />
        </div>
      ))}
    </div>
  );
};

export default PerformanceReviews;