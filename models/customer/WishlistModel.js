const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "wishlists";

const WishlistModel = {
  async getWishlist(userId) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $project: {
            _id: 0,
            productId: "$items.productId",
            name: { $arrayElemAt: ["$productDetails.name", 0] },
            price: { $arrayElemAt: ["$productDetails.price", 0] },
            image: { $arrayElemAt: ["$productDetails.image", 0] },
          },
        },
      ])
      .toArray();
  },

  async addItem(userId, productId) {
    const db = await getDB();
    await db.collection(COLLECTION_NAME).updateOne(
      { userId: new ObjectId(userId) },
      {
        $addToSet: {
          items: {
            productId: new ObjectId(productId),
          },
        },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  },

  async removeItem(userId, productId) {
    const db = await getDB();
    await db.collection(COLLECTION_NAME).updateOne(
      { userId: new ObjectId(userId) },
      {
        $pull: { items: { productId: new ObjectId(productId) } },
        $set: { updatedAt: new Date() },
      }
    );
  },

  async clearWishlist(userId) {
    const db = await getDB();
    await db.collection(COLLECTION_NAME).updateOne(
      { userId: new ObjectId(userId) },
      {
        $set: { items: [], updatedAt: new Date() },
      }
    );
  },
};

module.exports = WishlistModel;
