const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");

const COLLECTION_NAME = "seller_detail";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  avatar_uri: Joi.string().required(),
  brand_name: Joi.string().required(),
  contact_email: Joi.string().email().required(),
  business_address: Joi.array().items(Joi.string()).required(),
  product_categories: Joi.array()
    .items(
      Joi.object({
        category_id: Joi.string().required(),
        category_name: Joi.number().required(),
      })
    )
    .required(),
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
  addSellerDetail: async (sellerData) => {
    handleDBOperation(async (collection) => {
      const { error, value } = COLLECTION_SCHEMA.validate(sellerData, {
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

  getSellerDetail: async (seller_id) => {
    handleDBOperation(async (collection) => {
      return await collection(COLLECTION_NAME).findOne({ seller_id });
    });
  },

  updateCustomerDetail: async (seller_id, updateData) => {
    handleDBOperation(async (collection) => {
      await collection(COLLECTION_NAME).updateOne(
        { seller_id },
        { $set: updateData, $currentDate: { updated_at: true } }
      );
    });
  },
};

module.exports = UserDetailModel;
