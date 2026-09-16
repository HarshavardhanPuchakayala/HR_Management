import { useEffect, useRef, useState } from "react";
import { LuBellOff, LuCheckCheck, LuArrowUpRight } from "react-icons/lu";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications.js";
import {
  PageHeader,
  Alert,
  EmptyState,
} from "../components/Ui.jsx";
import { pageEnter } from "../lib/Motion.js";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headerRef = useRef(null);
  const listRef = useRef(null);

  const load = async () => {
    try {
      setError("");

      const data = await getNotifications();

      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading) return;

    pageEnter({
      header: headerRef.current,
      stagger: listRef.current?.querySelectorAll(".notification-row"),
      staggerAmount: 0.04,
    });
  }, [loading]);

  const markRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to mark as read."
      );
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsAsRead();
      await load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to mark all as read."
      );
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate">
        Loading notifications...
      </div>
    );
  }

  return (
    <div>
      <div ref={headerRef}>
        <PageHeader
          title="Notifications"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up."
          }
          action={
            unreadCount > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="btn-secondary"
              >
                <LuCheckCheck size={15} />
                Mark all as read
              </button>
            )
          }
        />
      </div>

      <Alert tone="error">{error}</Alert>

      <div ref={listRef}>
        {notifications.length === 0 ? (
          <EmptyState
            icon={LuBellOff}
            title="Nothing new"
            hint="Updates about your requests, reviews, and documents show up here."
          />
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notification) => (
              <article
                key={notification._id}
                className={`notification-row card flex items-start gap-4 p-4 ${
                  notification.isRead ? "opacity-70" : ""
                }`}
              >
                {/* Unread marker carries the state — no extra label needed */}
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                    notification.isRead ? "bg-line" : "bg-coral"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-0.5 text-sm text-slate">
                    {notification.message}
                  </p>
                  <p className="mt-1.5 text-xs text-slate/70">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {notification.link && (
                    <a
                      href={notification.link}
                      className="inline-flex items-center gap-1 text-sm font-medium text-coral hover:text-coralDark"
                    >
                      View
                      <LuArrowUpRight size={14} />
                    </a>
                  )}

                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(notification._id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-slate
                        transition-colors hover:border-ink hover:text-ink"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}