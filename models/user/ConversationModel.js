const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const USER_COLLECTION_NAME = "user_conversations";
const GROUP_COLLECTION_NAME = "group_conversations";

const USER_COLLECTION_SCHEMA = Joi.object({
  participants: Joi.array().items(Joi.string()).length(2).required(),
  last_message: Joi.object({
    message_id: Joi.string().required(),
    timestamp: Joi.date().required(),
  }).allow(null),
  create_at: Joi.date().required(),
  update_at: Joi.date().required(),
}).options({ abortEarly: false });

const GROUP_COLLECTION_SCHEMA = Joi.object({
  participants: Joi.array().items(Joi.string()).min(2).max(100).required(),
  admin_id: Joi.string().required(),
  group_name: Joi.string().required(),
  group_avatar: Joi.string().optional(),
  last_message: Joi.string().optional(),
  create_at: Joi.date().required(),
  update_at: Joi.date().required(),
}).options({ abortEarly: false });

//* For User Conservation
const findUserChatId = async (userA, userB) => {
  const db = getDB();
  try {
    let chat = await db.collection(USER_COLLECTION_NAME).findOne({
      participants: { $all: [userA, userB] },
    });

    if (!chat) {
      const newChat = {
        participants: [userA, userB],
        last_message: null,
        create_at: new Date(),
        update_at: new Date(),
      };

      const result = await db
        .collection(USER_COLLECTION_NAME)
        .insertOne(newChat);
      chat = result.ops[0];
    }
    return chat;
  } catch (error) {
    console.error("Error in getChatBox:", error);
    throw error;
  }
};

const getLastMessage = async (sender_id, receiver_id) => {
  const db = getDB();
  try {
    const chat = await db.collection(USER_COLLECTION_NAME).findOne({
      participants: { $all: [sender_id, receiver_id] },
    });

    if (chat && chat.last_message) {
      return chat.last_message;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in getLastMessage:", error);
    throw error;
  }
};

const addLastMessage = async (conversation_id, last_message) => {
  const db = getDB();
  try {
    await db
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(conversation_id) },
        { $set: { last_message: last_message, updated_at: new Date() } },
        { returnOriginal: false }
      );
  } catch (error) {
    console.error("Error updating last message:", error);
    throw error;
  }
};

//* For Group Conservation
const createGroupChat = async (admin_id, group_name, list_user_id) => {
  const db = getDB();
  try {
    const newGroupChat = {
      participants: list_user_id,
      admin_id: admin_id,
      group_name: group_name,
      last_message: null,
      create_at: new Date(),
      update_at: new Date(),
    };

    const { error } = GROUP_COLLECTION_SCHEMA.validate(newGroupChat);
    if (error) {
      throw new Error(error.details.map((x) => x.message).join(", "));
    }

    await db.collection(GROUP_COLLECTION_NAME).insertOne(newGroupChat);
  } catch (error) {
    console.error("Error in createGroupChat:", error);
    throw error;
  }
};

const getListGroupChat = async (user_id) => {
  const db = getDB();
  try {
    const groupChats = await db
      .collection(GROUP_COLLECTION_NAME)
      .find({
        participants: user_id,
      })
      .toArray();

    return groupChats;
  } catch (error) {
    console.error("Error in getListGroupChat:", error);
    throw error;
  }
};

const updateGroupAvatar = async (group_id, group_avatar) => {
  const db = getDB();
  console.log(group_id);
  console.log(group_avatar);
  try {
    await db
      .collection(GROUP_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(group_id) },
        { $set: { group_avatar: group_avatar, update_at: new Date() } }
      );
  } catch (error) {
    console.error("Error updating group avatar:", error);
    throw error;
  }
};

const updateGroupName = async (group_id, group_name) => {
  const db = getDB();
  try {
    await db
      .collection(GROUP_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(group_id) },
        { $set: { group_name: group_name, update_at: new Date() } }
      );
  } catch (error) {
    console.error("Error updating group name:", error);
    throw error;
  }
};

module.exports = {
  findUserChatId,
  getLastMessage,
  addLastMessage,
  createGroupChat,
  getListGroupChat,
  updateGroupAvatar,
  updateGroupName,
};
