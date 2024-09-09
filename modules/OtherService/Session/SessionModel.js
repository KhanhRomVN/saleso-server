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
    const session = await handleDBOperation(async (collection) => {
      // Kiểm tra xem có session nào trùng với customer_id và type "checkout-session" chưa
      const existingSession = await collection.findOne({
        customer_id,
        type: "checkout-session",
      });

      if (existingSession) {
        // Xóa hết các session cũ của customer_id
        await collection.deleteMany({
          customer_id,
          type: "checkout-session",
        });
      }

      // Tạo session mới
      const newSession = await collection.insertOne({
        ...data,
        customer_id,
        type: "checkout-session",
      });

      return newSession.ops[0];
    });

    return session;
  },

  cleanExpiredSessions: async () => {
    await handleDBOperation(async (collection) => {
      const now = new Date();
      const expirationTime = new Date(now.getTime() - 2 * 60 * 1000); // 2 phút trước

      // Xóa các session đã hết hạn
      await collection.deleteMany({
        type: "checkout-session",
        created_at: { $lte: expirationTime },
      });
    });
  },
};

module.exports = SessionModel;
