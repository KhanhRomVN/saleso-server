const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "orders";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  product_id: Joi.string().required(),
  selected_attributes_value: Joi.string(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().required(),
  total: Joi.number().required(),
  discount_id: Joi.string(),
  shipping_fee: Joi.number().min(0).required(),
  payment_method: Joi.string().valid("prepaid", "postpaid").required(),
  payment_status: Joi.string().valid("paid", "unpaid").required(),
  order_status: Joi.string().valid("pending", "accepted", "refused").required(),
  shipping_address: Joi.string().required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
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

const OrderModel = {
  createOrder: async (orderData) => {
    const { error } = COLLECTION_SCHEMA.validate(orderData);
    if (error) throw new Error(error.details.map((d) => d.message).join(", "));

    return handleDBOperation(async (collection) => {
      const result = await collection.insertOne(orderData);
      return result.insertedId;
    });
  },

  getOrder: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.find({ customer_id: customer_id }).toArray();
    });
  },

  getListAcceptOrder: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      return await collection
        .find({
          customer_id: customer_id,
          order_status: "accepted",
        })
        .toArray();
    });
  },

  getListRefuseOrder: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      return await collection
        .find({
          customer_id: customer_id,
          order_status: "refused",
        })
        .toArray();
    });
  },

  cancelOrder: async (order_id, customer_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(order_id), customer_id: customer_id },
        { $set: { order_status: "cancelled", updated_at: new Date() } }
      );
      if (result.modifiedCount === 0) {
        throw new Error("Order not found or already cancelled");
      }
      return { message: "Order cancelled successfully" };
    });
  },

  updateOrderStatus: async (order_id, newStatus) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(order_id) },
        { $set: { order_status: newStatus, updated_at: new Date() } }
      );
      if (result.modifiedCount === 0) {
        throw new Error("Order not found or status not changed");
      }
      return { message: "Order status updated successfully" };
    });
  },

  getOrderById: async (order_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.findOne({ _id: new ObjectId(order_id) });
    });
  },
};

module.exports = OrderModel;
