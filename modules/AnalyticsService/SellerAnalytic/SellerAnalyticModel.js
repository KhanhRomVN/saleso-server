const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "product_analytic";
const COLLECTION_SCHEMA = Joi.object({
  product_id: Joi.string().required(),
  month: Joi.number().required(),
  year: Joi.number().required(),
  view: Joi.number().required(),
  total_favorite: Joi.number().required(),
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
  getCart: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      const cart = await collection.findOne({
        customer_id: customer_id,
      });
      return cart || { customer_id, items: [] };
    });
  },

  addItem: async (customer_id, cartData) => {
    return handleDBOperation(async (collection) => {
      const { error } = CART_ITEM_SCHEMA.validate(cartData);
      if (error) throw new Error(error.details[0].message);

      await collection.updateOne(
        { customer_id: customer_id },
        {
          $push: { items: cartData },
          $setOnInsert: { createdAt: new Date() },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );
    });
  },

  removeItem: async (customer_id, product_id) => {
    return handleDBOperation(async (collection) => {
      await collection.updateOne(
        { customer_id: new ObjectId(customer_id) },
        {
          $pull: { items: { product_id: new ObjectId(product_id) } },
          $set: { updatedAt: new Date() },
        }
      );
    });
  },

  updateItemQuantity: async (customer_id, product_id, quantity) => {
    return handleDBOperation(async (collection) => {
      const { error } = CART_ITEM_SCHEMA.validate({ product_id, quantity });
      if (error) throw new Error(error.details[0].message);

      await collection.updateOne(
        {
          customer_id: customer_id,
          "items.product_id": product_id,
        },
        {
          $set: { "items.$.quantity": quantity, updatedAt: new Date() },
        }
      );
    });
  },

  clearCart: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      await collection.updateOne(
        { customer_id: customer_id },
        { $set: { items: [], updatedAt: new Date() } }
      );
    });
  },
};

module.exports = CartModel;
