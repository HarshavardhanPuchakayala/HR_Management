import { useEffect, useState } from "react";
import { LuStar, LuPlus } from "react-icons/lu";
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
import {
  PageHeader,
  Alert,
  Card,
  Field,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";

/** Rating shown as filled stars rather than a bare number. */
const Rating = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-sm text-slate">Not rated</span>;
  }

  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <LuStar
          key={step}
          size={15}
          className={
            step <= Number(value)
              ? "fill-amber text-amber"
              : "text-line"
          }
        />
      ))}
    </span>
  );
};

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

  const [editingReviewId, setEditingReviewId] = useState(null);

  const [editForm, setEditForm] = useState({
    rating: "",
    strengths: "",
    areasForImprovement: "",
    goals: "",
  });

  const [employeeComments, setEmployeeComments] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const cycleData = await getReviewCycles();

      setCycles(Array.isArray(cycleData) ? cycleData : []);

      if (role === "admin") {
        const reviewData = await getAllPerformanceReviews();

        setReviews(Array.isArray(reviewData) ? reviewData : []);
      }

      if (role === "manager") {
        const [reviewData, employeeData] = await Promise.all([
          getTeamPerformanceReviews(),
          getEmployees(),
        ]);

        const allEmployees = Array.isArray(employeeData)
          ? employeeData
          : [];

        /*
         * This filter only controls the UI selection.
         * The backend remains responsible for authorization.
         */
        const directReports = allEmployees.filter((employee) => {
          if (!employee.managerId) return false;

          const managerId =
            typeof employee.managerId === "object"
              ? employee.managerId._id
              : employee.managerId;

          return (
            managerId?.toString() === user.employeeId?.toString() &&
            employee.status === "active"
          );
        });

        setEmployees(directReports);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      }

      if (role === "employee") {
        const reviewData = await getMyPerformanceReviews();

        setReviews(Array.isArray(reviewData) ? reviewData : []);
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

    setCycleForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreateCycle = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      await createReviewCycle(cycleForm);

      setCycleForm({ name: "", startDate: "", endDate: "" });
      setMessage("Review cycle created.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create review cycle"
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
        err.response?.data?.message || "Failed to activate review cycle"
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
        err.response?.data?.message || "Failed to complete review cycle"
      );
    }
  };

  const handleReviewFormChange = (event) => {
    const { name, value } = event.target;

    setReviewForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      await createPerformanceReview(reviewForm);

      setReviewForm({ cycleId: "", employeeId: "" });
      setMessage("Performance review created.");

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
        review.rating === null || review.rating === undefined
          ? ""
          : review.rating,
      strengths: review.strengths || "",
      areasForImprovement: review.areasForImprovement || "",
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

    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSaveReview = async (id) => {
    try {
      setMessage("");
      setError("");

      const payload = {
        strengths: editForm.strengths,
        areasForImprovement: editForm.areasForImprovement,
        goals: editForm.goals,
      };

      if (editForm.rating !== "") {
        payload.rating = Number(editForm.rating);
      }

      await updatePerformanceReview(id, payload);

      setMessage("Performance review updated.");

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

      setMessage("Performance review submitted.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit performance review"
      );
    }
  };

  const handleEmployeeCommentChange = (reviewId, value) => {
    setEmployeeComments((previous) => ({ ...previous, [reviewId]: value }));
  };

  const handleAcknowledgeReview = async (id) => {
    try {
      setMessage("");
      setError("");

      await updatePerformanceReview(id, {
        employeeComments: employeeComments[id] || "",
      });

      setEmployeeComments((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });

      setMessage("Performance review acknowledged.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to acknowledge performance review"
      );
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return "Unknown employee";

    if (typeof employeeId === "object") {
      return employeeId.name || employeeId.email || "Unknown employee";
    }

    const employee = employees.find(
      (item) => item._id?.toString() === employeeId?.toString()
    );

    return employee?.name || employeeId;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading performance reviews...
      </div>
    );
  }

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isEmployee = role === "employee";

  return (
    <div>
      <PageHeader
        title="Performance Reviews"
        subtitle={
          isEmployee
            ? "Feedback shared with you, and your response to it."
            : "Run review cycles and write reviews for your people."
        }
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      {isAdmin && (
        <Card
          title="Create a review cycle"
          description="A named period that reviews are written against."
          className="mb-6"
        >
          <form onSubmit={handleCreateCycle}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Cycle name" htmlFor="cycleName">
                <input
                  id="cycleName"
                  name="name"
                  className="field-input"
                  placeholder="H1 2026"
                  value={cycleForm.name}
                  onChange={handleCycleChange}
                  required
                />
              </Field>

              <Field label="Start date" htmlFor="cycleStart">
                <input
                  id="cycleStart"
                  name="startDate"
                  type="date"
                  className="field-input"
                  value={cycleForm.startDate}
                  onChange={handleCycleChange}
                  required
                />
              </Field>

              <Field label="End date" htmlFor="cycleEnd">
                <input
                  id="cycleEnd"
                  name="endDate"
                  type="date"
                  className="field-input"
                  min={cycleForm.startDate || undefined}
                  value={cycleForm.endDate}
                  onChange={handleCycleChange}
                  required
                />
              </Field>
            </div>

            <button type="submit" className="btn-primary mt-5">
              <LuPlus size={15} />
              Create cycle
            </button>
          </form>
        </Card>
      )}

      {(isAdmin || isManager) && cycles.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Review cycles</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cycles.map((cycle) => (
              <div key={cycle._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold">
                      {cycle.name}
                    </p>
                    <p className="mt-0.5 text-sm text-slate">
                      {formatDate(cycle.startDate)} —{" "}
                      {formatDate(cycle.endDate)}
                    </p>
                  </div>
                  <StatusPill status={cycle.status} />
                </div>

                {isAdmin && (
                  <div className="mt-4 flex gap-2">
                    {cycle.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => handleActivateCycle(cycle._id)}
                        className="rounded-full bg-mint px-3.5 py-1.5 text-xs font-semibold text-ink
                          transition-colors hover:bg-mintDark hover:text-white"
                      >
                        Activate
                      </button>
                    )}

                    {cycle.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleCompleteCycle(cycle._id)}
                        className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium
                          transition-colors hover:border-ink"
                      >
                        Complete cycle
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isManager && (
        <Card title="Start a review" className="mb-6">
          <form onSubmit={handleCreateReview}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cycle" htmlFor="reviewCycle">
                <select
                  id="reviewCycle"
                  name="cycleId"
                  className="field-input"
                  value={reviewForm.cycleId}
                  onChange={handleReviewFormChange}
                  required
                >
                  <option value="">Select cycle</option>
                  {cycles
                    .filter((cycle) => cycle.status === "active")
                    .map((cycle) => (
                      <option key={cycle._id} value={cycle._id}>
                        {cycle.name}
                      </option>
                    ))}
                </select>
              </Field>

              <Field label="Employee" htmlFor="reviewEmployee">
                <select
                  id="reviewEmployee"
                  name="employeeId"
                  className="field-input"
                  value={reviewForm.employeeId}
                  onChange={handleReviewFormChange}
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button type="submit" className="btn-primary mt-5">
              Start review
            </button>
          </form>
        </Card>
      )}

      <h2 className="mb-4 text-lg font-semibold">
        {isEmployee ? "My reviews" : "Reviews"}
      </h2>

      {reviews.length === 0 ? (
        <EmptyState
          icon={LuStar}
          title="No reviews yet"
          hint={
            isEmployee
              ? "Reviews shared with you will appear here."
              : "Start a review for someone once a cycle is active."
          }
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isEditing = editingReviewId === review._id;
            const canEdit =
              (isManager || isAdmin) && review.status === "draft";
            const canAcknowledge =
              isEmployee && review.status === "submitted";

            return (
              <article key={review._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold">
                      {getEmployeeName(review.employeeId)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate">
                      {review.cycleId?.name || "No cycle"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Rating value={review.rating} />
                    <StatusPill status={review.status} />
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-5 space-y-4 border-t border-line pt-5">
                    <Field label="Rating (1–5)" htmlFor={`rating-${review._id}`}>
                      <input
                        id={`rating-${review._id}`}
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        step="1"
                        className="field-input"
                        value={editForm.rating}
                        onChange={handleEditChange}
                      />
                    </Field>

                    <Field label="Strengths" htmlFor={`strengths-${review._id}`}>
                      <textarea
                        id={`strengths-${review._id}`}
                        name="strengths"
                        rows="3"
                        className="field-input resize-none"
                        value={editForm.strengths}
                        onChange={handleEditChange}
                      />
                    </Field>

                    <Field
                      label="Areas for improvement"
                      htmlFor={`areas-${review._id}`}
                    >
                      <textarea
                        id={`areas-${review._id}`}
                        name="areasForImprovement"
                        rows="3"
                        className="field-input resize-none"
                        value={editForm.areasForImprovement}
                        onChange={handleEditChange}
                      />
                    </Field>

                    <Field label="Goals" htmlFor={`goals-${review._id}`}>
                      <textarea
                        id={`goals-${review._id}`}
                        name="goals"
                        rows="3"
                        className="field-input resize-none"
                        value={editForm.goals}
                        onChange={handleEditChange}
                      />
                    </Field>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveReview(review._id)}
                        className="btn-primary"
                      >
                        Save review
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                    {review.strengths && (
                      <div>
                        <p className="text-xs text-slate">Strengths</p>
                        <p className="mt-0.5">{review.strengths}</p>
                      </div>
                    )}

                    {review.areasForImprovement && (
                      <div>
                        <p className="text-xs text-slate">
                          Areas for improvement
                        </p>
                        <p className="mt-0.5">
                          {review.areasForImprovement}
                        </p>
                      </div>
                    )}

                    {review.goals && (
                      <div>
                        <p className="text-xs text-slate">Goals</p>
                        <p className="mt-0.5">{review.goals}</p>
                      </div>
                    )}

                    {review.employeeComments && (
                      <div className="rounded-xl bg-canvas p-3.5">
                        <p className="text-xs text-slate">
                          Employee response
                        </p>
                        <p className="mt-0.5">{review.employeeComments}</p>
                      </div>
                    )}

                    <div className="flex gap-5 text-xs text-slate">
                      {review.submittedAt && (
                        <span>
                          Submitted {formatDate(review.submittedAt)}
                        </span>
                      )}
                      {review.acknowledgedAt && (
                        <span>
                          Acknowledged {formatDate(review.acknowledgedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!isEditing && canEdit && (
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(review)}
                      className="btn-secondary"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitReview(review._id)}
                      className="btn-primary"
                    >
                      Submit to employee
                    </button>
                  </div>
                )}

                {canAcknowledge && (
                  <div className="mt-4 space-y-3 border-t border-line pt-4">
                    <Field
                      label="Your response (optional)"
                      htmlFor={`comment-${review._id}`}
                    >
                      <textarea
                        id={`comment-${review._id}`}
                        rows="3"
                        className="field-input resize-none"
                        value={employeeComments[review._id] || ""}
                        onChange={(event) =>
                          handleEmployeeCommentChange(
                            review._id,
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <button
                      type="button"
                      onClick={() => handleAcknowledgeReview(review._id)}
                      className="btn-primary"
                    >
                      Acknowledge review
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PerformanceReviews;