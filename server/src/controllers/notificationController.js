import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

export const getMyNotifications = async (
  req,
  res
) => {
  try {
    const notifications =
      await Notification.find({
        recipientId: req.user._id,
      })
        .sort({ createdAt: -1 })
        .limit(100);

    return res.json(notifications);
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch notifications",
    });
  }
};

export const getUnreadCount = async (
  req,
  res
) => {
  try {
    const count =
      await Notification.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

    return res.json({ count });
  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch unread notification count",
    });
  }
};

export const markAsRead = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message:
          "Invalid notification ID",
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: id,
          recipientId: req.user._id,
        },
        {
          $set: {
            isRead: true,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.json(notification);
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (
  req,
  res
) => {
  try {
    await Notification.updateMany(
      {
        recipientId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.json({
      message:
        "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to mark notifications as read",
    });
  }
};