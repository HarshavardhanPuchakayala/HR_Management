import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LuLogIn, LuLogOut, LuClock } from "react-icons/lu";
/*
 * NOTE: this page assumes ../api/attendance.js exports getMyAttendance,
 * checkIn and checkOut alongside the getEmployeeAttendance / getAllAttendance
 * that AttendanceOversight already uses. If your module names them
 * differently, change these three imports only — nothing else here depends
 * on the names.
 */
import {
  getMyAttendance,
  checkIn,
  checkOut,
} from "../api/attendance.js";
import {
  PageHeader,
  Alert,
  Card,
  Table,
  Td,
  StatusPill,
  EmptyState,
} from "../components/Ui.jsx";

const isToday = (date) => {
  const value = new Date(date);
  const today = new Date();

  return (
    value.getDate() === today.getDate() &&
    value.getMonth() === today.getMonth() &&
    value.getFullYear() === today.getFullYear()
  );
};

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(new Date());

  const clockRef = useRef(null);

  // Live clock — the one piece of continuous motion on the page, and it
  // carries real information rather than decoration.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      setError("");

      const data = await getMyAttendance();

      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load your attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading || !clockRef.current) return;

    gsap.from(clockRef.current, {
      opacity: 0,
      y: 14,
      duration: 0.5,
      ease: "power3.out",
    });
  }, [loading]);

  const todayRecord = records.find((record) => isToday(record.date));

  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);

  const handleCheckIn = async () => {
    try {
      setWorking(true);
      setError("");
      setMessage("");

      await checkIn();

      setMessage("Checked in.");

      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check in.");
    } finally {
      setWorking(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setWorking(true);
      setError("");
      setMessage("");

      await checkOut();

      setMessage("Checked out.");

      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check out.");
    } finally {
      setWorking(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString() : "—";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading your attendance...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Check in when you start, check out when you're done."
      />

      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{message}</Alert>

      {/* The clock is the hero of this page — it's what people come here for */}
      <div
        ref={clockRef}
        className="flex flex-wrap items-center justify-between gap-6 rounded-xl2 bg-ink px-8 py-8 text-white"
      >
        <div>
          <p className="text-sm text-white/50">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="mt-1 font-display text-5xl font-semibold tabular-nums">
            {now.toLocaleTimeString()}
          </p>

          <div className="mt-4 flex gap-6 text-sm">
            <span className="text-white/50">
              In{" "}
              <span className="text-white">
                {formatTime(todayRecord?.checkIn)}
              </span>
            </span>
            <span className="text-white/50">
              Out{" "}
              <span className="text-white">
                {formatTime(todayRecord?.checkOut)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={working || hasCheckedIn}
            className="inline-flex items-center gap-2 rounded-full bg-mint px-6 py-3 font-semibold text-ink
              transition-colors hover:bg-mintDark hover:text-white disabled:opacity-40"
          >
            <LuLogIn size={17} />
            {hasCheckedIn ? "Checked in" : "Check in"}
          </button>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={working || !hasCheckedIn || hasCheckedOut}
            className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-semibold text-white
              transition-colors hover:bg-coralDark disabled:opacity-40"
          >
            <LuLogOut size={17} />
            {hasCheckedOut ? "Checked out" : "Check out"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">Recent days</h2>

        {records.length === 0 ? (
          <EmptyState
            icon={LuClock}
            title="No attendance yet"
            hint="Check in above and today's record will appear here."
          />
        ) : (
          <Table head={["Date", "Status", "Check in", "Check out"]}>
            {records.map((record) => (
              <tr key={record._id} className="bg-surface">
                <Td className="font-medium">{formatDate(record.date)}</Td>
                <Td>
                  <StatusPill status={record.status} />
                </Td>
                <Td className="text-slate">{formatTime(record.checkIn)}</Td>
                <Td className="text-slate">
                  {formatTime(record.checkOut)}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}