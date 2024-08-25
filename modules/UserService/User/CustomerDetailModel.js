const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");

const COLLECTION_NAME = "customer_detail";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  avatar_uri: Joi.string(),
  name: Joi.string().required(),
  shipping_address: Joi.array().items(Joi.string()),
  age: Joi.number().required(),
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

const UserDetailModel = {
  addCustomerDetail: async (customerData) => {
    return handleDBOperation(async (collection) => {
      const { error, value } = COLLECTION_SCHEMA.validate(customerData, {
        abortEarly: false,
      });
      if (error) {
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );
      }

      return await collection.insertOne({ value });
    });
  },

  getCustomerDetail: async (customer_id) => {
    return handleDBOperation(async (collection) => {
      return await collection(COLLECTION_NAME).findOne({ customer_id });
    });
  },

  updateCustomerDetail: async (customer_id, updateData) => {
    return handleDBOperation(async (collection) => {
      await collection(COLLECTION_NAME).updateOne(
        { customer_id },
        { $set: updateData, $currentDate: { updated_at: true } }
      );
    });
  },
};

module.exports = UserDetailModel;
