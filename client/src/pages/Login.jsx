import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { LuSparkles, LuArrowRight } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const panelRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(heroRef.current, { opacity: 0, x: -20, duration: 0.6 }).from(
        panelRef.current,
        { opacity: 0, x: 20, duration: 0.6 },
        "-=0.45"
      );
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email, password);

      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );

      gsap.fromTo(
        panelRef.current,
        { x: -6 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Hero side */}
      <div
        ref={heroRef}
        className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-coral/20" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-mint/10" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral">
            <LuSparkles size={18} />
          </div>
          <span className="font-display text-lg font-semibold">PeopleFlow</span>
        </div>

        <div className="relative max-w-sm">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Every leave, payslip, and review — one place.
          </h1>
          <p className="mt-4 text-white/60">
            Sign in to check in for the day, follow up on a request,
            or catch up on what your team needs from you.
          </p>
        </div>

        <p className="relative text-sm text-white/30">
          &copy; {new Date().getFullYear()} PeopleFlow
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-canvas p-8">
        <div ref={panelRef} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral">
                <LuSparkles className="text-white" size={18} />
              </div>
              <span className="font-display text-lg font-semibold">
                PeopleFlow
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-slate">
            Enter your work email and password.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="field-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-coral/10 px-3.5 py-2.5 text-sm text-coralDark">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <LuArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate">
            Don't have an account? Contact your PeopleFlow administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;