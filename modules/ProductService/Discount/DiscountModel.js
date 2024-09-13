const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const COLLECTION_NAME = "discounts";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  code: Joi.string().required(),
  type: Joi.string()
    .valid("percentage", "flash-sale", "first-time", "free-shipping")
    .required(),
  value: Joi.number().min(0).max(100).required(),
  // Minimum amount to apply a discount to a product
  minimum_purchase: Joi.number().required(),
  // Maximum number of times the discount can be used
  max_uses: Joi.number().required(),
  current_uses: Joi.number().required(),
  // The number of times that customers can use this discount
  customer_usage_limit: Joi.number().default(1).min(1).required(),
  applicable_products: Joi.array().items(Joi.string()),
  status: Joi.string().valid("upcoming", "ongoing", "expired").required(),
  is_active: Joi.boolean().default(true),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
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

const validateDiscount = (discountData) => {
  const { error } = COLLECTION_SCHEMA.validate(discountData);
  if (error) throw error;

  if (discountData.type === "flash-sale") {
    validateFlashSaleDiscount(discountData.startDate, discountData.endDate);
  }
};

const validateFlashSaleDiscount = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    start.getMinutes() !== 0 ||
    start.getSeconds() !== 0 ||
    end.getMinutes() !== 0 ||
    end.getSeconds() !== 0
  ) {
    throw new Error("Flash-sale start and end times must be on the hour");
  }

  const durationHours = (end - start) / (1000 * 60 * 60);
  if (durationHours < 1 || durationHours > 10) {
    throw new Error("Flash-sale duration must be between 1 and 10 hours");
  }
};

const DiscountModel = {
  async createDiscount(discountData) {
    validateDiscount(discountData);
    if (discountData.type === "flash-sale") {
      const now = new Date();
      const startDate = new Date(discountData.startDate);
      if (startDate <= now) {
        throw new Error("Flash-sale start time must be in the future");
      }
    }
    return handleDBOperation(async (collection) => {
      const result = await collection.insertOne(discountData);
      return result.insertedId;
    });
  },

  async getAllDiscounts(sellerId) {
    return handleDBOperation((collection) =>
      collection.find({ seller_id: sellerId }).toArray()
    );
  },

  async getDiscountById(id) {
    return handleDBOperation((collection) =>
      collection.findOne({ _id: new ObjectId(id) })
    );
  },

  async getDiscountsByIds(ids) {
    return handleDBOperation(async (collection) => {
      const objectIds = ids.map((id) => new ObjectId(id));
      const discounts = await collection
        .find({
          _id: { $in: objectIds },
        })
        .toArray();

      if (discounts.length !== ids.length) {
        console.warn(
          `Not all discounts were found. Requested: ${ids.length}, Found: ${discounts.length}`
        );
      }

      return discounts;
    });
  },

  async updateDiscount(id, updateData) {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    });
  },

  async deleteDiscount(id) {
    return handleDBOperation(async (collection) => {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    });
  },

  async getActiveDiscounts(sellerId) {
    return handleDBOperation((collection) =>
      collection.find({ seller_id: sellerId, isActive: true }).toArray()
    );
  },

  async getInactiveDiscounts(sellerId) {
    return handleDBOperation((collection) =>
      collection.find({ seller_id: sellerId, isActive: false }).toArray()
    );
  },

  async getUpcomingDiscounts(sellerId) {
    const currentDate = new Date();
    return handleDBOperation((collection) =>
      collection
        .find({
          seller_id: sellerId,
          startDate: { $gt: currentDate },
          status: "upcoming",
        })
        .toArray()
    );
  },

  async getOngoingDiscounts(sellerId) {
    const currentDate = new Date();
    return handleDBOperation((collection) =>
      collection
        .find({
          seller_id: sellerId,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
          status: "ongoing",
        })
        .toArray()
    );
  },

  async getExpiredDiscounts(sellerId) {
    const currentDate = new Date();
    return handleDBOperation((collection) =>
      collection
        .find({
          seller_id: sellerId,
          endDate: { $lt: currentDate },
          status: "expired",
        })
        .toArray()
    );
  },

  async updateDiscountName(id, newName) {
    return this.updateDiscount(id, { name: newName });
  },

  async updateDiscountDescription(id, newDescription) {
    return this.updateDiscount(id, { description: newDescription });
  },

  async toggleDiscountStatus(id) {
    return handleDBOperation(async (collection) => {
      const discount = await collection.findOne({ _id: new ObjectId(id) });
      if (!discount) return null;

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: !discount.isActive } }
      );
      return result.modifiedCount > 0;
    });
  },

  async updateDiscountStatuses() {
    return handleDBOperation(async (collection) => {
      const currentDate = new Date();

      await collection.bulkWrite([
        {
          updateMany: {
            filter: {
              status: "upcoming",
              startDate: { $lte: currentDate },
              endDate: { $gt: currentDate },
            },
            update: { $set: { status: "ongoing" } },
          },
        },
        {
          updateMany: {
            filter: {
              status: { $in: ["upcoming", "ongoing"] },
              endDate: { $lte: currentDate },
            },
            update: { $set: { status: "expired" } },
          },
        },
      ]);
    });
  },

  async applyDiscountToProduct(status, discountId, productId) {
    const db = getDB();
    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        const discountResult = await handleDBOperation(async (collection) => {
          return collection.updateOne(
            { _id: new ObjectId(discountId) },
            { $addToSet: { applicableProducts: productId } },
            { session }
          );
        });
        if (discountResult.modifiedCount === 0) {
          throw new Error("Failed to update discount");
        }

        let updateField;
        if (status === "upcoming") {
          updateField = "upcoming_discounts";
        } else if (status === "ongoing") {
          updateField = "ongoing_discounts";
        } else {
          throw new Error("Invalid discount status");
        }

        const productResult = await db
          .collection("products")
          .updateOne(
            { _id: new ObjectId(productId) },
            { $addToSet: { [updateField]: discountId } },
            { session }
          );
        if (productResult.modifiedCount === 0) {
          throw new Error("Failed to update product");
        }
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    } finally {
      await session.endSession();
    }
  },

  async removeDiscountFromProduct(status, discountId, productId) {
    const db = getDB();
    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        const discountResult = await handleDBOperation(async (collection) => {
          return collection.updateOne(
            { _id: new ObjectId(discountId) },
            { $pull: { applicableProducts: productId } },
            { session }
          );
        });
        if (discountResult.modifiedCount === 0) {
          throw new Error("Failed to update discount");
        }

        let updateField;
        if (status === "upcoming") {
          updateField = "upcoming_discounts";
        } else if (status === "ongoing") {
          updateField = "ongoing_discounts";
        } else {
          throw new Error("Invalid discount status");
        }

        const productResult = await db
          .collection("products")
          .updateOne(
            { _id: new ObjectId(productId) },
            { $pull: { [updateField]: discountId } },
            { session }
          );
        if (productResult.modifiedCount === 0) {
          throw new Error("Failed to update product");
        }
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    } finally {
      await session.endSession();
    }
  },
};

module.exports = DiscountModel;
