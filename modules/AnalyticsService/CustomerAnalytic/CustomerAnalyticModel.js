const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "customer_analytic";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  favorite_categories: Joi.array().items(Joi.string()),
  customer_score: Joi.number().required(),
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

const CustomerAnalyticModel = {
  newCustomerAnalytic: async (newCustomerAnalyticData) => {
    return handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(newCustomerAnalyticData);
      if (error)
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );

      return await collection.insertOne(newCustomerAnalyticData);
    });
  },

  updateCustomerScore: async (customer_id, score) => {
    return handleDBOperation(async (collection) => {
      return await collection.updateOne(
        { customer_id },
        { $set: { customer_score: score } }
      );
    });
  },

  updateNewCategory: async (customer_id, categories) => {
    return handleDBOperation(async (collection) => {
      // First, get the current favorite_categories
      const customer = await collection.findOne({ customer_id });
      if (!customer) {
        throw new Error(`Customer with id ${customer_id} not found`);
      }

      const currentCategories = customer.favorite_categories || [];

      // Filter out categories that already exist
      const newCategories = categories.filter(
        (category) => !currentCategories.includes(category)
      );

      // If there are new categories to add, update the document
      if (newCategories.length > 0) {
        return await collection.updateOne(
          { customer_id },
          { $addToSet: { favorite_categories: { $each: newCategories } } }
        );
      } else {
        return { matchedCount: 1, modifiedCount: 0 };
      }
    });
  },
};

module.exports = CustomerAnalyticModel;
