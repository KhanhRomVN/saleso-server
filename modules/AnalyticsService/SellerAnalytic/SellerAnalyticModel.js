const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const Joi = require("joi");

const COLLECTION_NAME = "seller_analytic";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  month: Joi.number().required(),
  year: Joi.number().required(),
  // Sales array to store total revenue and total products sold for each day in a month
  sales: Joi.array()
    .items(
      Joi.object({
        day: Joi.number().required(),
        // total revenue for the day
        revenue: Joi.number().required(),
        // total products sold during the day
        sold: Joi.number().required(),
      })
    )
    .min(29)
    .max(31)
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

const SellerAnalyticModel = {
  // Used when creating a new sales account
  createSellerAnalytic: async (seller_id) => {
    return handleDBOperation(async (collection) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const daysInMonth = new Date(year, month, 0).getDate();

      const sales = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        revenue: 0,
        sold: 0,
      }));

      const newAnalytic = {
        seller_id,
        year,
        month,
        sales,
      };

      const { error } = COLLECTION_SCHEMA.validate(newAnalytic);
      if (error)
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );

      return await collection.insertOne(newAnalytic);
    });
  },

  // Used when the customer has successfully paid for the order and has successfully delivered the goods
  updateSellerAnalytic: async (seller_id, price, quantity) => {
    return handleDBOperation(async (collection) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      const filter = { seller_id, year, month };
      const update = {
        $inc: {
          [`sales.${day - 1}.revenue`]: price,
          [`sales.${day - 1}.sold`]: quantity,
        },
      };

      const result = await collection.updateOne(filter, update, {
        upsert: true,
      });

      if (result.upsertedCount > 0) {
        // If a new document was created, initialize it properly
        const daysInMonth = new Date(year, month, 0).getDate();
        const sales = Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          revenue: i + 1 === day ? price : 0,
          sold: i + 1 === day ? quantity : 0,
        }));

        const newAnalytic = { seller_id, year, month, sales };
        const { error } = COLLECTION_SCHEMA.validate(newAnalytic);
        if (error)
          throw new Error(
            `Validation error: ${error.details.map((d) => d.message).join(", ")}`
          );

        await collection.updateOne(
          { _id: result.upsertedId },
          { $set: newAnalytic }
        );
      }

      return result;
    });
  },
};

module.exports = SellerAnalyticModel;
