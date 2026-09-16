import { Link } from "react-router-dom";
import { LuLock, LuArrowLeft } from "react-icons/lu";

export default function NotAuthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink">
          <LuLock className="text-white" size={22} />
        </div>

        <h1 className="mt-6 font-display text-2xl font-semibold">
          This page isn't open to your role
        </h1>

        <p className="mt-2 text-slate">
          If you think you should have access, ask your PeopleFlow
          administrator to update your role.
        </p>

        <Link to="/" className="btn-primary mt-7">
          <LuArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}