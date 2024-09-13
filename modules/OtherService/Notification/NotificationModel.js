const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");

const COLLECTION_NAME = "notifications";
const notificationSchema = Joi.object({
  user_id: Joi.string().required(),
  message: Joi.string().required(),
  link: Joi.string(),
  type: Joi.string().required(),
  status: Joi.string().valid("read", "unread").default("unread"),
  created_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const createNotification = async (notificationData) => {
  const db = await getDB();
  try {
    await db.collection(COLLECTION_NAME).insertOne(notificationData);
  } catch (error) {
    console.error("Error in createNotification: ", error);
    throw error;
  }
};

const getNotifications = async (user_id) => {
  const db = await getDB();
  try {
    return await db.collection(COLLECTION_NAME).find({ user_id }).toArray();
  } catch (error) {
    console.error("Error in getNotifications: ", error);
    throw error;
  }
};

const markAsRead = async (user_id, notification_id) => {
  const db = await getDB();
  try {
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(notification_id), user_id },
        { $set: { status: "read" } }
      );
  } catch (error) {
    console.error("Error in markAsRead: ", error);
    throw error;
  }
};

const deleteNotification = async (user_id, notification_id) => {
  const db = await getDB();
  try {
    await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(notification_id),
      user_id,
    });
  } catch (error) {
    console.error("Error in deleteNotification: ", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
};
