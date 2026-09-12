import { useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications.js";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const markRead = async (id) => {
    await markNotificationAsRead(id);
    await load();
  };

  const markAll = async () => {
    await markAllNotificationsAsRead();
    await load();
  };

  return (
    <div>
      <h1>Notifications</h1>

      <button onClick={markAll}>
        Mark All as Read
      </button>

      {notifications.length === 0 && (
        <p>No notifications.</p>
      )}

      {notifications.map((notification) => (
        <div key={notification._id}>
          <strong>{notification.title}</strong>

          <p>{notification.message}</p>

          <small>
            {new Date(notification.createdAt).toLocaleString()}
          </small>

          {!notification.isRead && (
            <button
              onClick={() => markRead(notification._id)}
            >
              Mark Read
            </button>
          )}

          {notification.link && (
            <a href={notification.link}>
              View
            </a>
          )}
        </div>
      ))}
    </div>
  );
}