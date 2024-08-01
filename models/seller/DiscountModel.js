const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const cron = require("node-cron");

const COLLECTION_NAME = "discounts";

const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  name: Joi.string().required(),
  code: Joi.string().required(),
  type: Joi.string().valid("percentage", "fixed", "buy_x_get_y").required(),
  value: Joi.alternatives().conditional("type", {
    is: "buy_x_get_y",
    then: Joi.object({
      buyQuantity: Joi.number().required(),
      getFreeQuantity: Joi.number().required(),
    }),
    otherwise: Joi.number().required(),
  }),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  minimumPurchase: Joi.number().required(),
  maxUses: Joi.number().required(),
  currentUses: Joi.number().default(0),
  isActive: Joi.boolean().default(true),
  description: Joi.string(),
  applicableProducts: Joi.array().items(Joi.string()),
  customerUsageLimit: Joi.number().default(1).min(1).required(),
  status: Joi.string().valid("upcoming", "ongoing", "expired").required(),
}).options({ abortEarly: false });

const validateDiscount = (discountData) => {
  const { error } = COLLECTION_SCHEMA.validate(discountData);
  if (error) throw error;
};

const DiscountModel = {
  async createDiscount(discountData) {
    validateDiscount(discountData);
    const db = await getDB();
    const result = await db.collection(COLLECTION_NAME).insertOne(discountData);
    return result.insertedId;
  },

  async getAllDiscounts(sellerId) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .find({ seller_id: sellerId })
      .toArray();
  },

  async getDiscountById(id) {
    const db = await getDB();
    return db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
  },

  async updateDiscount(id, updateData) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    return result.modifiedCount > 0;
  },

  async deleteDiscount(id) {
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },

  async getActiveDiscounts(sellerId) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .find({ seller_id: sellerId, isActive: true })
      .toArray();
  },

  async getInactiveDiscounts(sellerId) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .find({ seller_id: sellerId, isActive: false })
      .toArray();
  },

  async getUpcomingDiscounts(sellerId) {
    const db = await getDB();
    const currentDate = new Date();
    return db
      .collection(COLLECTION_NAME)
      .find({
        seller_id: sellerId,
        startDate: { $gt: currentDate },
        status: "upcoming",
      })
      .toArray();
  },

  async getOngoingDiscounts(sellerId) {
    const db = await getDB();
    const currentDate = new Date();
    return db
      .collection(COLLECTION_NAME)
      .find({
        seller_id: sellerId,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        status: "ongoing",
      })
      .toArray();
  },

  async getExpiredDiscounts(sellerId) {
    const db = await getDB();
    const currentDate = new Date();
    return db
      .collection(COLLECTION_NAME)
      .find({
        seller_id: sellerId,
        endDate: { $lt: currentDate },
        status: "expired",
      })
      .toArray();
  },

  async getTopUsedDiscounts(sellerId, limit = 10) {
    const db = await getDB();
    return db
      .collection(COLLECTION_NAME)
      .find({ seller_id: sellerId })
      .sort({ currentUses: -1 })
      .limit(limit)
      .toArray();
  },

  async updateDiscountName(id, newName) {
    return this.updateDiscount(id, { name: newName });
  },

  async updateDiscountDescription(id, newDescription) {
    return this.updateDiscount(id, { description: newDescription });
  },

  async changeActiveDiscount(id, isActive) {
    return this.updateDiscount(id, { isActive });
  },

  async bulkCreateDiscounts(discountsData) {
    discountsData.forEach(validateDiscount);
    const db = await getDB();
    const result = await db
      .collection(COLLECTION_NAME)
      .insertMany(discountsData);
    return result.insertedIds;
  },

  async cloneDiscount(id) {
    const db = await getDB();
    const originalDiscount = await this.getDiscountById(id);
    if (!originalDiscount) return null;

    const { _id, ...clonedDiscount } = originalDiscount;
    clonedDiscount.name = `Clone of ${clonedDiscount.name}`;
    clonedDiscount.code = `${clonedDiscount.code}_CLONE`;
    clonedDiscount.currentUses = 0;

    const result = await db
      .collection(COLLECTION_NAME)
      .insertOne(clonedDiscount);
    return result.insertedId;
  },

  async getDiscountUsageStats(id) {
    const db = await getDB();
    const discount = await this.getDiscountById(id);
    if (!discount) return null;

    return {
      totalUses: discount.currentUses,
      remainingUses: discount.maxUses - discount.currentUses,
      usagePercentage: (discount.currentUses / discount.maxUses) * 100,
    };
  },

  async updateDiscountStatuses() {
    const db = await getDB();
    const currentDate = new Date();
    console.log(currentDate);

    // Update upcoming to ongoing
    await db.collection(COLLECTION_NAME).updateMany(
      {
        status: "upcoming",
        startDate: { $lte: currentDate },
        endDate: { $gt: currentDate },
      },
      { $set: { status: "ongoing" } }
    );

    // Update ongoing to expired
    await db.collection(COLLECTION_NAME).updateMany(
      {
        status: "ongoing",
        endDate: { $lte: currentDate },
      },
      { $set: { status: "expired" } }
    );
  },

  async applyDiscountToProduct(discountId, productId) {
    const db = await getDB();
    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        const discountResult = await db
          .collection(COLLECTION_NAME)
          .updateOne(
            { _id: new ObjectId(discountId) },
            { $addToSet: { applicableProducts: productId } },
            { session }
          );

        if (discountResult.modifiedCount === 0) {
          throw new Error("Failed to update discount");
        }

        // Add discountId to applied_discounts in the product
        const productResult = await db
          .collection("products")
          .updateOne(
            { _id: new ObjectId(productId) },
            { $addToSet: { applied_discounts: discountId } },
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

// Set up cron job to run every minute
cron.schedule("* * * * *", async () => {
  console.log("Running discount status update");
  try {
    await DiscountModel.updateDiscountStatuses();
    console.log("Discount statuses updated successfully");
  } catch (error) {
    console.error("Error updating discount statuses:", error);
  }
});

module.exports = DiscountModel;
