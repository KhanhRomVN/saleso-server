const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const UserModel = require("./UserModel");

const COLLECTION_NAME = "user_detail";
const COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required(),
  name: Joi.string().optional(),
  age: Joi.number().integer().min(0).optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  address: Joi.string().optional(),
  about: Joi.string().optional(),
  avatar: Joi.string().uri().optional(),
}).options({ abortEarly: false });

const validateUserDetail = (userDetailData) => {
  const validation = COLLECTION_SCHEMA.validate(userDetailData);
  if (validation.error) {
    throw new Error(
      validation.error.details.map((detail) => detail.message).join(", ")
    );
  }
};

const createUserDetail = async (user_id) => {
  try {
    const db = getDB();
    await db
      .collection(COLLECTION_NAME)
      .insertOne({ user_id: user_id.toString() });
  } catch (error) {
    console.error("Error adding user detail:", error);
    throw new Error("Failed to add user detail");
  }
};

const getUserDetailByUserId = async (userId) => {
  try {
    const db = getDB();
    return await db.collection(COLLECTION_NAME).findOne({ user_id: userId });
  } catch (error) {
    console.error("Error getting user detail:", error);
    throw new Error("Failed to get user detail");
  }
};

const updateUserDetailField = async (user_id, updateData) => {
  const db = getDB();
  try {
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { user_id },
        { $set: updateData, $currentDate: { update_at: true } }
      );
  } catch (error) {
    throw new Error("Failed to update user detail: " + error.message);
  }
};

module.exports = {
  createUserDetail,
  getUserDetailByUserId,
  updateUserDetailField,
};
