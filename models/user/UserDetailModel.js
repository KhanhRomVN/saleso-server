const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");

const COLLECTION_NAME = "user_detail";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string(),
  seller_id: Joi.string(),
  name: Joi.string().optional(),
  age: Joi.number().integer().min(0).optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  address: Joi.array().items(Joi.string()),
  about: Joi.string(),
  avatar_uri: Joi.string().uri(),
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

  createUserDetail: async (user_id, role) => {
    const db = getDB();
    await db
      .collection(COLLECTION_NAME)
      .insertOne({ [`${role}_id`]: user_id.toString() });
  },

  getUserDetailByUserId: async (user_id, role) => {
    const db = getDB();
    return await db
      .collection(COLLECTION_NAME)
      .findOne({ [`${role}_id`]: user_id });
  },

  updateUserDetailField: async (user_id, updateData, role) => {
    const db = getDB();
    UserDetailModel.validateUserDetail(updateData);

    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { [`${role}_id`]: user_id },
        { $set: updateData, $currentDate: { updated_at: true } }
      );
  },
};

module.exports = UserDetailModel;
