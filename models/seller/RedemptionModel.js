const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "redemptions";

const COLLECTION_SCHEMA = Joi.object({
  discount_id: Joi.string().required(),
  user_id: Joi.string().required(),
  order_id: Joi.string().required(),
  redeemed_at: Joi.date().default(() => new Date()),
  discount_value: Joi.number().required(),
  order_total: Joi.number().required(),
}).options({ abortEarly: false });

const validateRedemption = (redemptionData) => {
  const { error } = COLLECTION_SCHEMA.validate(redemptionData);
  if (error) throw error;
};

const RedemptionModel = {
  async createRedemption(redemptionData) {
    validateRedemption(redemptionData);
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .insertOne(redemptionData);
    return result.insertedId;
  },

  async getRedemptionsByDiscountId(discountId) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .find({ discount_id: discountId })
      .toArray();
  },

  async getRedemptionsByUserId(userId) {
    const db = await getDB();
    return db.collection(COLLECTION_NAME).find({ user_id: userId }).toArray();
  },

  async getRedemptionByOrderId(orderId) {
    const db = await getDB();
    return db.collection(COLLECTION_NAME).findOne({ order_id: orderId });
  },

  async getTotalRedemptionsByDiscountId(discountId) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: { discount_id: discountId } },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .toArray();
    return result[0] ? result[0].total : 0;
  },

  async getTotalValueByDiscountId(discountId) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: { discount_id: discountId } },
        { $group: { _id: null, totalValue: { $sum: "$discount_value" } } },
      ])
      .toArray();
    return result[0] ? result[0].totalValue : 0;
  },

  async deleteRedemption(id) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },
};

module.exports = RedemptionModel;
