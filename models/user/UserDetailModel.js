const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");

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

const UserDetailModel = {
  validateUserDetail: (userDetailData) => {
    const validation = COLLECTION_SCHEMA.validate(userDetailData);
    if (validation.error) {
      throw new Error(
        validation.error.details.map((detail) => detail.message).join(", ")
      );
    }
  },

  createUserDetail: async (user_id) => {
    const db = getDB();
    await db
      .collection(COLLECTION_NAME)
      .insertOne({ user_id: user_id.toString() });
  },

  getUserDetailByUserId: async (userId) => {
    const db = getDB();
    return await db.collection(COLLECTION_NAME).findOne({ user_id: userId });
  },

  updateUserDetailField: async (user_id, updateData) => {
    const db = getDB();
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { user_id },
        { $set: updateData, $currentDate: { update_at: true } }
      );
  },
};

module.exports = UserDetailModel;
