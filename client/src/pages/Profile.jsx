import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  LuMail,
  LuPhone,
  LuBriefcase,
  LuBuilding2,
  LuUserCog,
  LuPencil,
  LuEye,
  LuEyeOff,
  LuLock,
} from "react-icons/lu";
import { getMyProfile, updateMyProfile, changePassword } from "../api/employees.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Alert, Field } from "../components/Ui.jsx";
import { prefersReducedMotion } from "../lib/Motion.js";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3.5 border-b border-line py-4 last:border-none">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-slate">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-ink">
        {value || "Not set"}
      </p>
    </div>
  </div>
);

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Profile() {
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editable profile fields — phone only. Name/email/role/jobTitle/
  // department stay read-only, owned by admin via AdminEmployees.
  // (The backend's updateMyProfile only ever accepts `phone` — see
  // employeeController.js — so the form here is intentionally narrow
  // to match. Don't add `name` back here without updating the backend too.)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const cardRef = useRef(null);

  const loadProfile = async () => {
    try {
      setError("");

      const data = await getMyProfile();
      const record = data?.employee || data;

      setEmployee(record);
      setEditForm({
        phone: record?.phone || "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (loading || !cardRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(cardRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "opacity,transform",
      }
    );
  }, [loading]);

  const startEditing = () => {
    setEditForm({
      phone: employee?.phone || "",
    });
    setProfileError("");
    setProfileMessage("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setProfileError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setProfileError("");
      setProfileMessage("");

      // Only phone is accepted by the backend's updateMyProfile —
      // name/email/etc. are admin-managed and must not be sent here.
      const data = await updateMyProfile({
        phone: editForm.phone.trim(),
      });

      const updated = data?.employee || data;

      setEmployee((previous) => ({ ...previous, ...updated }));
      setIsEditing(false);
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    try {
      setChangingPassword(true);

      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordForm(emptyPasswordForm);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowPasswordForm(false);
      setPasswordMessage("Password changed.");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const name = employee?.name || user?.name;
  const role = employee?.role || user?.role;
  const initial = (name || "?").slice(0, 1).toUpperCase();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading your profile...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-slate">Your details on file with PeopleFlow.</p>

      <Alert tone="error">{error}</Alert>

      <div ref={cardRef} className="mt-6 max-w-xl space-y-6">
        {/* ================= Profile card ================= */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-4 bg-ink px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral font-display text-xl font-semibold text-white">
                {initial}
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-white">
                  {name || "Your name"}
                </p>
                <span className="pill mt-1.5 bg-white/10 capitalize text-white">
                  {role || "employee"}
                </span>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={startEditing}
                aria-label="Edit profile"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70
                  transition-colors hover:bg-white/10 hover:text-white"
              >
                <LuPencil size={16} />
              </button>
            )}
          </div>

          <div className="px-6">
            {(profileError || profileMessage) && (
              <div className="pt-4">
                <Alert tone="error">{profileError}</Alert>
                <Alert tone="success">{profileMessage}</Alert>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 py-5">
                {/* Name is intentionally read-only here — only admins can
                    change it (via AdminEmployees). The backend does not
                    accept name on this endpoint. */}
                <div>
                  <p className="field-label">Name</p>
                  <p className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-slate">
                    {employee?.name || user?.name}
                  </p>
                  <p className="mt-1.5 text-xs text-slate">
                    Name can't be changed here. Contact an administrator.
                  </p>
                </div>

                <Field label="Phone" htmlFor="phone">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="field-input"
                    value={editForm.phone}
                    onChange={handleEditChange}
                  />
                </Field>

                {/* Email is intentionally read-only here */}
                <div>
                  <p className="field-label">Email</p>
                  <p className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-slate">
                    {employee?.email || user?.email}
                  </p>
                  <p className="mt-1.5 text-xs text-slate">
                    Email can't be changed here. Contact an administrator.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary"
                  >
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={savingProfile}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <InfoRow
                  icon={LuMail}
                  label="Email"
                  value={employee?.email || user?.email}
                />
                <InfoRow icon={LuPhone} label="Phone" value={employee?.phone} />
                <InfoRow
                  icon={LuBriefcase}
                  label="Job title"
                  value={employee?.jobTitle}
                />
                <InfoRow
                  icon={LuBuilding2}
                  label="Department"
                  value={employee?.department}
                />
                <InfoRow
                  icon={LuUserCog}
                  label="Role"
                  value={
                    role ? role.charAt(0).toUpperCase() + role.slice(1) : undefined
                  }
                />
              </>
            )}
          </div>
        </div>

        {/* ================= Password card ================= */}
        <div className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-slate">
                <LuLock size={16} />
              </div>
              <div>
                <p className="font-medium text-ink">Password</p>
                <p className="text-sm text-slate">
                  Change the password you sign in with.
                </p>
              </div>
            </div>

            {!showPasswordForm && (
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(true);
                  setPasswordMessage("");
                  setPasswordError("");
                }}
                className="btn-secondary"
              >
                Change password
              </button>
            )}
          </div>

          {(passwordError || passwordMessage) && !showPasswordForm && (
            <div className="mt-4">
              <Alert tone="error">{passwordError}</Alert>
              <Alert tone="success">{passwordMessage}</Alert>
            </div>
          )}

          {showPasswordForm && (
            <form
              onSubmit={handleSubmitPassword}
              className="mt-5 space-y-4 border-t border-line pt-5"
            >
              <Alert tone="error">{passwordError}</Alert>

              <Field label="Current password" htmlFor="currentPassword">
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    className="field-input pr-11"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword((previous) => !previous)
                    }
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate hover:bg-canvas hover:text-ink"
                  >
                    {showCurrentPassword ? (
                      <LuEyeOff size={17} />
                    ) : (
                      <LuEye size={17} />
                    )}
                  </button>
                </div>
              </Field>

              <Field label="New password" htmlFor="newPassword">
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="field-input pr-11"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((previous) => !previous)}
                    aria-label={
                      showNewPassword ? "Hide new password" : "Show new password"
                    }
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate hover:bg-canvas hover:text-ink"
                  >
                    {showNewPassword ? (
                      <LuEyeOff size={17} />
                    ) : (
                      <LuEye size={17} />
                    )}
                  </button>
                </div>
              </Field>

              <Field label="Confirm new password" htmlFor="confirmPassword">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="field-input"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  minLength={8}
                  required
                />
              </Field>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn-primary"
                >
                  {changingPassword ? "Changing..." : "Change password"}
                </button>

                <button
                  type="button"
                  disabled={changingPassword}
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm(emptyPasswordForm);
                    setPasswordError("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}