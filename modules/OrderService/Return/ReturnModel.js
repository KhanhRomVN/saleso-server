const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "returns";
const COLLECTION_SCHEMA = Joi.object({
  order_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  reason: Joi.string().required(),
  images: Joi.array().items(Joi.string()).min(1).required(),
  logs: Joi.array().items(Joi.string()).required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
});

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const WishlistModel = {
  getWishlist: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      return;
    });
  },
};

module.exports = WishlistModel;
