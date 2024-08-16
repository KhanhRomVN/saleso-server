const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");
const { ProductModel } = require("../../models/index");

const COLLECTION_NAME = "wishlists";

const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  wishlist: Joi.array().items(Joi.string()),
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

const WishlistModel = {
  getWishlist: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      const wishlist = await collection.findOne({ customer_id: customer_id });
      if (!wishlist || !wishlist.wishlist) return [];
      const productDetails = await Promise.all(
        wishlist.wishlist.map(async (product_id) => {
          const db = getDB();
          const product = await db.collection("products").findOne({
            _id: new ObjectId(product_id),
          });
          if (!product) return null;
          const maxPrice = product.attributes
            ? Math.max(
                ...product.attributes.map((attr) => attr.attributes_price)
              )
            : product.price;
          const totalStock = product.attributes
            ? product.attributes.reduce(
                (sum, attr) => sum + attr.attributes_quantity,
                0
              )
            : product.stock;
          return {
            _id: product._id,
            name: product.name,
            image: product.images[0],
            price: maxPrice,
            stock: totalStock,
          };
        })
      );
      return productDetails.filter((product) => product !== null);
    });
  },

  addToWishlist: async (customer_id, product_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { customer_id: customer_id },
        {
          $addToSet: { wishlist: product_id },
          $setOnInsert: { created_at: new Date() },
          $set: { updated_at: new Date() },
        },
        { upsert: true }
      );
      return result.modifiedCount > 0 || result.upsertedCount > 0;
    });
  },

  removeFromWishlist: async (customer_id, product_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { customer_id: customer_id },
        {
          $pull: { wishlist: product_id },
          $set: { updated_at: new Date() },
        }
      );
      return result.modifiedCount > 0;
    });
  },

  clearWishlist: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { customer_id: customer_id },
        {
          $set: { wishlist: [], updated_at: new Date() },
        }
      );
      return result.modifiedCount > 0;
    });
  },
};

module.exports = WishlistModel;
