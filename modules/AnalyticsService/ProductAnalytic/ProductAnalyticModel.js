const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "product_analytic";
const COLLECTION_SCHEMA = Joi.object({
  product_id: Joi.string().required(),
  month: Joi.number().required(),
  year: Joi.number().required(),
  total_view: Joi.number().required(),
  total_wishlist: Joi.number().required(),
  total_cart: Joi.number().required(),
  total_sell: Joi.number().required(),
  total_revenue: Joi.number().required(),
  discount_used: Joi.number().required(),
  total_return: Joi.number().required(),
  return_rate: Joi.number().required(),
  // Statistics of countries that have purchased products
  country_destruction: Joi.array().items(
    Joi.object({
      country: Joi.string().required(),
      count: Joi.number().required(),
    })
  ),
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

const ProductAnalyticModel = {
  // Create analytics information (only used when creating new products)
  createNewProductAnalytic: async (productAnalyticData) => {
    return handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(productAnalyticData);
      if (error)
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );

      return await collection.insertOne(productAnalyticData);
    });
  },

  // Updated when users click to view the product
  updateViewProduct: async (product_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.updateOne(
        { product_id },
        { $inc: { total_view: 1 } }
      );
    });
  },

  // Updated when users add products to their wishlist
  updateWishlistProduct: async (product_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.updateOne(
        { product_id },
        { $inc: { total_wishlist: 1 } }
      );
    });
  },

  // Updated when a user adds a product to their cart
  updateCartProduct: async (product_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.updateOne(
        { product_id },
        { $inc: { total_cart: 1 } }
      );
    });
  },

  // Updated when invoices and orders are successfully paid
  updateSellProduct: async (product_id, price, country) => {
    return handleDBOperation(async (collection) => {
      const update = {
        $inc: {
          total_sell: 1,
          total_revenue: price,
          "country_destruction.$[elem].count": 1,
        },
        $setOnInsert: {
          "country_destruction.$[elem]": { country, count: 1 },
        },
      };

      const options = {
        arrayFilters: [{ "elem.country": country }],
        upsert: true,
      };

      return await collection.updateOne({ product_id }, update, options);
    });
  },

  // Updated when users receive discounts or offers for this product
  updateDiscountUsed: async (product_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.updateOne(
        { product_id },
        { $inc: { discount_used: 1 } }
      );
    });
  },

  // Updated when the user wants to return the goods (used after successful payment)
  updateReturnProduct: async (product_id) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.findOneAndUpdate(
        { product_id },
        { $inc: { total_return: 1 } },
        { returnOriginal: false }
      );

      // Update return rate
      const returnRate = result.value.total_return / result.value.total_sell;
      await collection.updateOne(
        { product_id },
        { $set: { return_rate: returnRate } }
      );
    });
  },
};

module.exports = ProductAnalyticModel;
