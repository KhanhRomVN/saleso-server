const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "refunds";
const COLLECTION_SCHEMA = Joi.object({
  order_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  refund_type: Joi.string()
    .valid("reversal_order", "out_of_stock", "other")
    .required(),
  refund_status: Joi.string()
    .valid("processing", "completed")
    .default("processing"),
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

const RefundModel = {
  acceptReversalAsRefund: async (refundData) => {
    return handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(refundData);
      if (error) throw new Error(error.details[0].message);
      const result = await collection.insertOne(refundData);
      return result.insertedId;
    });
  },

  getListRefund: async (seller_id, status) => {
    return handleDBOperation(async (collection) => {
      return await collection
        .find({ seller_id, refund_status: status })
        .toArray();
    });
  },

  getRefundById: async (refund_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.findOne({ _id: new ObjectId(refund_id) });
    });
  },

  acceptRefund: async (seller_id, refund_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(refund_id), seller_id },
        {
          $set: {
            refund_status: "completed",
            updated_at: new Date(),
          },
          $push: {
            logs: "Seller has agreed to the refund",
          },
        }
      );
      return result.modifiedCount > 0;
    });
  },
};

module.exports = RefundModel;
