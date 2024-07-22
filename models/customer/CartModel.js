const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "carts";

class CartModel {
  static async addCart(user_id, prodId, quantity = 1) {
    const db = getDB();
    await db.collection(COLLECTION_NAME).updateOne(
      {
        user_id: new ObjectId(user_id),
        "products.prodId": new ObjectId(prodId),
      },
      {
        $inc: { "products.$.quantity": quantity },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  }

  static async getListProductOfCart(user_id) {
    const db = getDB();
    return db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: { user_id: new ObjectId(user_id) } },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.prodId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $project: {
            _id: 0,
            prodId: "$products.prodId",
            quantity: "$products.quantity",
            name: { $arrayElemAt: ["$productDetails.name", 0] },
            price: { $arrayElemAt: ["$productDetails.price", 0] },
            image: { $arrayElemAt: ["$productDetails.image", 0] },
          },
        },
      ])
      .toArray();
  }

  static async updateCartQuantity(user_id, prodId, quantity) {
    const db = getDB();
    if (quantity > 0) {
      await db.collection(COLLECTION_NAME).updateOne(
        {
          user_id: new ObjectId(user_id),
          "products.prodId": new ObjectId(prodId),
        },
        {
          $set: { "products.$.quantity": quantity, updatedAt: new Date() },
        }
      );
    } else {
      await this.delCart(user_id, prodId);
    }
  }

  static async delCart(user_id, prodId) {
    const db = getDB();
    await db.collection(COLLECTION_NAME).updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $pull: { products: { prodId: new ObjectId(prodId) } },
        $set: { updatedAt: new Date() },
      }
    );
  }

  static async delCarts(user_id, prodList) {
    const db = getDB();
    await db.collection(COLLECTION_NAME).updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $pull: {
          products: { prodId: { $in: prodList.map((id) => new ObjectId(id)) } },
        },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

module.exports = CartModel;
