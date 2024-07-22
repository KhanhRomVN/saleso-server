const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "orders";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  product_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  discount_type: Joi.string().optional(),
  discount_name: Joi.string().optional(),
  discount_time: Joi.object({
    start: Joi.date(),
    end: Joi.date(),
  }).optional(),
  discount: Joi.number().min(0).max(1).optional(),
  shipping_fee: Joi.number().min(0).required(),
  total_amount: Joi.number().min(0).required(),
  payment_method: Joi.string().valid("prepaid", "postpaid").required(),
  payment_status: Joi.string().valid("paid", "unpaid").required(),
  order_status: Joi.string().valid("pending", "accepted", "refused").required(),
  deliver_status: Joi.string()
    .valid()
    .optional("in transit", "delivered", "failed delivery"),
  shipping_address: Joi.object().required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateOrder = (order) => {
  const { error } = COLLECTION_SCHEMA.validate(order);
  if (error) throw error;
};

const getOrderById = async (order_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(order_id) });
  } catch (error) {
    throw error;
  }
};

const getListOrder = async (customer_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .find({ customer_id: customer_id })
      .toArray();
  } catch (error) {
    throw error;
  }
};

const getListAcceptOrder = async (customer_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .find({ customer_id: customer_id, order_status: "accepted" })
      .toArray();
  } catch (error) {
    throw error;
  }
};

const getListRefuseOrder = async (customer_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .find({ customer_id: customer_id, order_status: "rejected" })
      .toArray();
  } catch (error) {
    throw error;
  }
};

const createOrder = async (orderProduct) => {
  const db = getDB();
  try {
    validateOrder(orderProduct);
    const result = await db.collection(COLLECTION_NAME).insertOne(orderProduct);
    return result.insertedId;
  } catch (error) {
    throw error;
  }
};

const cancelOrder = async (order_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(order_id) });
  } catch (error) {
    throw error;
  }
};

const updateOrderStatus = async (
  order_id,
  new_order_status,
  new_deliver_status
) => {
  const db = getDB();
  try {
    await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(order_id) },
      {
        $set: {
          order_status: new_order_status,
          deliver_status: new_deliver_status,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.error("Error updating invoice status:", error);
    throw error;
  }
};

module.exports = {
  getOrderById,
  getListOrder,
  getListAcceptOrder,
  getListRefuseOrder,
  createOrder,
  cancelOrder,
  updateOrderStatus,
};
