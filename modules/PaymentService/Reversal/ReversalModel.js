const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "reversals";
const COLLECTION_SCHEMA = Joi.object({
  order_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  reason: Joi.string().required(),
  images: Joi.array().items(Joi.string()),
  logs: Joi.array().items(Joi.string()).required(),
  reversal_method: Joi.string().valid("replace-product", "refund"),
  reversal_status: Joi.string().valid("pending", "accepted").required(),
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

const ReversalModel = {
  reversalOrder: async (reversalData) => {
    return handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(reversalData);
      if (error) throw new Error(error.details[0].message);
      const result = await collection.insertOne(reversalData);
      return result.insertedId;
    });
  },

  getListReversal: async (seller_id, status) => {
    return handleDBOperation(async (collection) => {
      return await collection
        .find({ seller_id, reversal_status: status })
        .toArray();
    });
  },

  getReversalById: async (reversal_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.findOne({ _id: new ObjectId(reversal_id) });
    });
  },

  acceptReversal: async (method, reversal_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(reversal_id) },
        {
          $set: {
            reversal_status: "accepted",
            reversal_method: method,
            updated_at: new Date(),
          },
        }
      );
      return result.modifiedCount > 0;
    });
  },
};

module.exports = ReversalModel;
