const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "session";

const SESSION_CHECKOUT_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  type: Joi.string().required(),
  product_id: Joi.string().required(),
  quantity: Joi.number().required(),
  selected_attributes_value: Joi.string(),
  created_at: Joi.date().default(Date.now),
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

const SessionModel = {
  createSessionCheckout: async (data, customer_id) => {
    await handleDBOperation(async (collection) => {
      const existingSession = await collection.findOne({
        customer_id,
        type: "checkout-session",
      });
      if (existingSession) {
        await collection.deleteMany({
          customer_id,
          type: "checkout-session",
        });
      }
      await collection.insertOne({
        ...data,
        customer_id,
        type: "checkout-session",
        created_at: new Date(),
      });
    });
  },

  createSessionCartID: async (data, customer_id) => {
    await handleDBOperation(async (collection) => {
      console.log(data);

      const existingSession = await collection.findOne({
        customer_id,
        type: "cart-session",
      });
      if (existingSession) {
        await collection.deleteMany({
          customer_id,
          type: "cart-session",
        });
      }
      await collection.insertOne({
        cartList: data,
        customer_id,
        type: "cart-session",
        created_at: new Date(),
      });
    });
  },

  getSessionData: async (customer_id, type) => {
    return await handleDBOperation(async (collection) => {
      const session = await collection.findOne({ customer_id, type });
      if (!session) {
        throw new Error(`No ${type} found for customer ${customer_id}`);
      }
      return session;
    });
  },

  cleanExpiredSessions: async () => {
    await handleDBOperation(async (collection) => {
      const now = new Date();
      const expirationTime = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
      await collection.deleteMany({
        type: { $in: ["checkout-session", "cart-session"] },
        created_at: { $lte: expirationTime },
      });
    });
  },
};

module.exports = SessionModel;
