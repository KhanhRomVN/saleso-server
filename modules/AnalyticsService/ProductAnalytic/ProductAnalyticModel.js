const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "product_analytic";

const COLLECTION_SCHEMA = Joi.object({
  product_id: Joi.string().required(),
  year: Joi.number().required(),
  month: Joi.number().required(),
  revenue: Joi.number().required(),
  visitor: Joi.number().required(),
  wishlist_additions: Joi.number().required(),
  cart_additions: Joi.number().required(),
  orders_placed: Joi.number().required(),
  orders_cancelled: Joi.number().required(),
  orders_successful: Joi.number().required(),
  reversal: Joi.number().required(),
  discount_applications: Joi.number().required(),
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
  newProductAnalytic: async (productAnalyticData) => {
    return handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(productAnalyticData);
      if (error)
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );
      return await collection.insertOne(productAnalyticData);
    });
  },

  updateValueAnalyticProduct: async (product_id, key, value) => {
    return handleDBOperation(async (collection) => {
      // [1]: Get current year and month
      // JavaScript months are 0-indexed

      // [2]: Check if data exists for the current year and month
      let existingData = await collection.findOne({
        product_id,
        year: currentYear,
        month: currentMonth,
      });

      if (!existingData) {
        // Create new data with default values
        const defaultData = {
          product_id,
          year: currentYear,
          month: currentMonth,
          revenue: 0,
          visitor: 0,
          wishlist_additions: 0,
          cart_additions: 0,
          orders_placed: 0,
          orders_cancelled: 0,
          orders_successful: 0,
          reversal: 0,
          discount_applications: 0,
          [key]: value, // Set the specified key to the given value
        };

        const { error } = COLLECTION_SCHEMA.validate(defaultData);
        if (error) {
          throw new Error(
            `Validation error: ${error.details.map((d) => d.message).join(", ")}`
          );
        }

        return await collection.insertOne(defaultData);
      } else {
        // Update existing data
        return await collection.updateOne(
          { product_id, year: currentYear, month: currentMonth },
          { $set: { [key]: value } }
        );
      }
    });
  },
};

module.exports = ProductAnalyticModel;
