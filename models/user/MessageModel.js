const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const ConversationModel = require("./ConversationModel");

const COLLECTION_NAME = "messages";
const COLLECTION_SCHEMA = Joi.object({
  conservation_id: Joi.string().required(),
  sender_id: Joi.string().required(),
  message: Joi.string().required(),
  image: Joi.string().optional(),
  create_at: Joi.date().default(() => new Date()),
}).options({ abortEarly: false });

const addMessage = async (messageData) => {
  const db = getDB();
  try {
    messageData.create_at = new Date();
    await ConversationModel.addLastMessage(
      messageData.conservation_id,
      messageData.message
    );
    const result = await db.collection(COLLECTION_NAME).insertOne(messageData);
    return result;
  } catch (error) {
    console.error("Error in addMessage: ", error);
    throw error;
  }
};

//* For User Conservation & Group Conservation
const getAllMessage = async (conservation_id) => {
  const db = getDB();
  try {
    const result = await db
      .collection(COLLECTION_NAME)
      .find({ conservation_id })
      .toArray();
    return result;
  } catch (error) {
    console.error("Error in getAllMessage: ", error);
    throw error;
  }
};

const getAllImage = async (conservation_id) => {
  const db = getDB();
  try {
    const result = await db
      .collection(COLLECTION_NAME)
      .find({ conservation_id, image: { $exists: true, $ne: "" } })
      .toArray();
    return result;
  } catch (error) {
    console.error("Error in getAllImage: ", error);
    throw error;
  }
};

module.exports = {
  addMessage,
  getAllMessage,
  getAllImage,
};
