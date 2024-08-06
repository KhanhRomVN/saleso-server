const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "carts";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .required(),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const CartModel = {
  async getCart(customer_id) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .findOne({ customer_id: new ObjectId(customer_id) });
  },

  async addItem(customer_id, productId, quantity) {
    const db = await getDB();
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { customer_id: new ObjectId(customer_id) },
      {
        $push: {
          items: {
            productId: new ObjectId(productId),
            quantity: quantity,
          },
        },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    const { value: updatedCart } = await db
      .collection(COLLECTION_NAME)
      .findOneAndUpdate(
        { customer_id: new ObjectId(customer_id) },
        { $set: { updatedAt: new Date() } },
        { returnDocument: "after" }
      );

    const { error } = COLLECTION_SCHEMA.validate(updatedCart);
    if (error)
      throw new Error(
        `Cart validation error: ${error.details.map((d) => d.message).join(", ")}`
      );

    return updatedCart;
  },

  async updateItem(customer_id, productId, quantity) {
    const db = await getDB();
    const result = await db.collection(COLLECTION_NAME).updateOne(
      {
        customer_id: new ObjectId(customer_id),
        "items.productId": new ObjectId(productId),
      },
      {
        $set: { "items.$.quantity": quantity, updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("Item not found in cart");
    }

    return this.getCart(customer_id);
  },

  async removeItem(customer_id, productId) {
    const db = await getDB();
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { customer_id: new ObjectId(customer_id) },
      {
        $pull: { items: { productId: new ObjectId(productId) } },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Item not found in cart");
    }

    return this.getCart(customer_id);
  },

  async clearCart(customer_id) {
    const db = await getDB();
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { customer_id: new ObjectId(customer_id) },
      {
        $set: { items: [], updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("Cart not found");
    }

    return this.getCart(customer_id);
  },
};

module.exports = CartModel;
