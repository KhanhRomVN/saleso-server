const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "session";

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
  createSessionData: async (data, customer_id) => {
    return await handleDBOperation(async (collection) => {
      const sessionData = {
        customer_id,
        data,
        created_at: new Date(),
      };
      const result = await collection.insertOne(sessionData);
      return result.insertedId;
    });
  },

  getSessionData: async (customer_id, session_id) => {
    const schema = Joi.object({
      customer_id: Joi.string().required(),
      session_id: Joi.string().required(),
    });

    const { error } = schema.validate({ customer_id, session_id });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    return await handleDBOperation(async (collection) => {
      return await collection.findOne({
        _id: new ObjectId(session_id),
        customer_id: customer_id,
      });
    });
  },

  cleanExpiredSessions: async () => {
    await handleDBOperation(async (collection) => {
      const now = new Date();
      const expirationTime = new Date(now.getTime() - 2 * 60 * 1000);
      await collection.deleteMany({
        created_at: { $lte: expirationTime },
      });
    });
  },
};

module.exports = SessionModel;
