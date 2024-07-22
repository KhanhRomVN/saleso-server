const { NotificationModel } = require("../../models/index");
const logger = require("../../config/logger");

const createNotification = async (user_id, message, type, link = null) => {
  try {
    const notificationData = {
      user_id,
      message,
      type,
      link,
    };
    await NotificationModel.createNotification(notificationData);
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const getListNotification = async (req, res) => {
  const user_id = req.user._id.toString();
  try {
    const notifications = await NotificationModel.getNotifications(user_id);
    res.status(200).json(notifications);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Failed to get notifications." });
  }
};

const deleteNotification = async (req, res) => {
  const user_id = req.user._id.toString();
  const { notification_id } = req.body;
  try {
    await NotificationModel.deleteNotification(user_id, notification_id);
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Failed to delete notification." });
  }
};

const markAsRead = async (req, res) => {
  const user_id = req.user._id.toString();
  const { notification_id } = req.body;
  try {
    await NotificationModel.markAsRead(user_id, notification_id);
    res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Failed to mark notification as read." });
  }
};

module.exports = {
  createNotification,
  getListNotification,
  deleteNotification,
  markAsRead,
};
