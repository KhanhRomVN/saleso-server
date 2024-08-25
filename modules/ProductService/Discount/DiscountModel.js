const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "discounts";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  name: Joi.string().required(),
  code: Joi.string().required(),
  type: Joi.string()
    .valid("percentage", "fixed", "buy_x_get_y", "flash-sale")
    .required(),
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
  applicableProducts: Joi.array().items(Joi.string()),
  customerUsageLimit: Joi.number().default(1).min(1).required(),
  status: Joi.string().valid("upcoming", "ongoing", "expired").required(),
}).options({ abortEarly: false });

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

  async getDiscountsByIds(ids) {
    const db = await getDB();
    try {
      const objectIds = ids.map((id) => new ObjectId(id));

      // Fetch discounts from the database
      const discounts = await db
        .collection(COLLECTION_NAME)
        .find({
          _id: { $in: objectIds },
        })
        .toArray();

      // If not all discounts were found, log a warning
      if (discounts.length !== ids.length) {
        console.warn(
          `Not all discounts were found. Requested: ${ids.length}, Found: ${discounts.length}`
        );
      }

      return discounts;
    } catch (error) {
      console.error("Error in getDiscountsByIds:", error);
      throw error;
    }
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

  async updateDiscountName(id, newName) {
    return this.updateDiscount(id, { name: newName });
  },

  async updateDiscountDescription(id, newDescription) {
    return this.updateDiscount(id, { description: newDescription });
  },

  async toggleActiveDiscount(id) {
    const db = await getDB();
    const discount = await this.getDiscountById(id);
    if (!discount) return null;

    const result = await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: !discount.isActive } }
      );
    return result.modifiedCount > 0;
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

  async updateDiscountStatuses() {
    const db = await getDB();
    const currentDate = new Date();

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

  async applyDiscountToProduct(status, discountId, productId) {
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

  async cancelDiscountForProduct(status, discountId, productId) {
    const db = await getDB();
    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        const discountResult = await db
          .collection(COLLECTION_NAME)
          .updateOne(
            { _id: new ObjectId(discountId) },
            { $pull: { applicableProducts: productId } },
            { session }
          );
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
