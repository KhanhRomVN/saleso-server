const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "product_analytic";
const COLLECTION_SCHEMA = Joi.object({
  product_id: Joi.string().required(),
  month: Joi.number().required(),
  year: Joi.number().required(),
  total_view: Joi.number().required(),
  total_wishlist: Joi.number().required(),
  total_cart: Joi.number().required(),
  total_sell: Joi.number().required(),
  total_revenue: Joi.number().required(),
  discount_used: Joi.number().required(),
  total_return: Joi.number().required(),
  return_rate: Joi.number().required(),
  // Statistics of countries that have purchased products
  country_destruction: Joi.array().items(
    Joi.object({
      country: Joi.string().required(),
      count: Joi.number().required(),
    })
  ),
}).options({ abortEarly: false });

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const CartModel = {
  viewProduct: async (product_id) => {
    return handleDBOperation(async (collection) => {
      await collection.updateOne({ product_id });
    });
  },
};

module.exports = CartModel;
