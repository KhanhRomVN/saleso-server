const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const cron = require("node-cron");
const moment = require("moment-timezone");

const COLLECTION_NAME = "discounts";

const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  name: Joi.string().required(),
  code: Joi.string().required(),
  type: Joi.string()
    .valid(
      "percentage",
      "fixed",
      "buy_x_get_y",
      "tiered",
      "bundle",
      "first_time",
      "loyalty"
    )
    .required(),
  value: Joi.alternatives().conditional("type", {
    is: "buy_x_get_y",
    then: Joi.object({
      buyQuantity: Joi.number().required(),
      getFreeQuantity: Joi.number().required(),
    }),
    otherwise: Joi.when("type", {
      is: "tiered",
      then: Joi.array().items(
        Joi.object({
          threshold: Joi.number().required(),
          discount: Joi.number().required(),
        })
      ),
      otherwise: Joi.when("type", {
        is: "bundle",
        then: Joi.object({
          products: Joi.array().items(Joi.string()).required(),
          bundlePrice: Joi.number().required(),
        }),
        otherwise: Joi.number().required(),
      }),
    }),
  }),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  minimumPurchase: Joi.number(),
  maxUses: Joi.number(),
  currentUses: Joi.number().default(0),
  isActive: Joi.boolean().default(true),
  description: Joi.string(),
  applicableProducts: Joi.array().items(Joi.string()),
  applicableCategories: Joi.array().items(Joi.string()),
  version: Joi.number().default(1),
  scheduleActivation: Joi.date(),
  scheduleDeactivation: Joi.date(),
  userUsageLimit: Joi.number().default(1).min(1),
  status: Joi.string().valid("upcoming", "active", "expired").required(),
}).options({ abortEarly: false });

const validateDiscount = (discountData) => {
  const { error } = COLLECTION_SCHEMA.validate(discountData);
  if (error) throw error;
};

const createDiscount = async (discountData) => {
  validateDiscount(discountData);
  const db = getDB();
  await db.collection(COLLECTION_NAME).insertOne(discountData);
};

const getAllDiscounts = async (page = 1, limit = 10, seller_id) => {
  const db = getDB();
  const skip = (page - 1) * limit;
  const total = await db
    .collection(COLLECTION_NAME)
    .countDocuments({ seller_id });
  const discounts = await db
    .collection(COLLECTION_NAME)
    .find({ seller_id })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    discounts,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};

const getActiveDiscounts = async (page = 1, limit = 10, seller_id) => {
  const db = getDB();
  const skip = (page - 1) * limit;
  const query = { seller_id, status: "active" };
  const total = await db.collection(COLLECTION_NAME).countDocuments(query);
  const discounts = await db
    .collection(COLLECTION_NAME)
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    discounts,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};

const getExpiredDiscounts = async (page = 1, limit = 10, seller_id) => {
  const db = getDB();
  const skip = (page - 1) * limit;
  const query = { seller_id, status: "expired" };
  const total = await db.collection(COLLECTION_NAME).countDocuments(query);
  const discounts = await db
    .collection(COLLECTION_NAME)
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    discounts,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};

const getInactiveDiscounts = async (page = 1, limit = 10, seller_id) => {
  const db = getDB();
  const skip = (page - 1) * limit;
  const query = { seller_id, isActive: false };
  const total = await db.collection(COLLECTION_NAME).countDocuments(query);
  const discounts = await db
    .collection(COLLECTION_NAME)
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    discounts,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};

const getUpcomingDiscounts = async (page = 1, limit = 10, seller_id) => {
  const db = getDB();
  const skip = (page - 1) * limit;
  const query = { seller_id, status: "upcoming" };
  const total = await db.collection(COLLECTION_NAME).countDocuments(query);
  const discounts = await db
    .collection(COLLECTION_NAME)
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    discounts,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  };
};

const getTopUsedDiscounts = async (limit = 5, seller_id) => {
  const db = getDB();
  return await db
    .collection(COLLECTION_NAME)
    .find({ seller_id })
    .sort({ currentUses: -1 })
    .limit(limit)
    .toArray();
};

const getDiscountById = async (id, seller_id) => {
  const db = getDB();
  return await db
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id), seller_id });
};

const updateDiscountName = async (id, newName, seller_id) => {
  const db = getDB();
  const result = await db
    .collection(COLLECTION_NAME)
    .updateOne(
      { _id: new ObjectId(id), seller_id },
      { $set: { name: newName }, $inc: { version: 1 } }
    );
  return result.modifiedCount;
};

const updateDiscountStatus = async (id, isActive, seller_id) => {
  const db = getDB();
  const result = await db
    .collection(COLLECTION_NAME)
    .updateOne(
      { _id: new ObjectId(id), seller_id },
      { $set: { isActive }, $inc: { version: 1 } }
    );
  return result.modifiedCount;
};

const updateDiscountApplicability = async (
  id,
  applicableProducts,
  applicableCategories,
  seller_id
) => {
  const db = getDB();
  const result = await db.collection(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id), seller_id },
    {
      $set: { applicableProducts, applicableCategories },
      $inc: { version: 1 },
    }
  );
  return result.modifiedCount;
};

const deleteDiscount = async (id, seller_id) => {
  const db = getDB();
  const result = await db
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id), seller_id });
  return result.deletedCount;
};

const applyDiscount = async (products, discountCode, userId) => {
  const db = getDB();
  const discount = await db
    .collection(COLLECTION_NAME)
    .findOne({ code: discountCode, isActive: true, status: "active" });

  if (!discount) throw new Error("Invalid or inactive discount code");

  let totalDiscount = 0;
  const totalPurchase = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  switch (discount.type) {
    case "percentage":
      totalDiscount = (totalPurchase * discount.value) / 100;
      break;
    case "fixed":
      totalDiscount = Math.min(discount.value, totalPurchase);
      break;
    case "buy_x_get_y":
      // Implementation for buy_x_get_y discount type
      break;
    case "tiered":
      const applicableTier = discount.value
        .sort((a, b) => b.threshold - a.threshold)
        .find((tier) => totalPurchase >= tier.threshold);
      if (applicableTier) {
        totalDiscount = (totalPurchase * applicableTier.discount) / 100;
      }
      break;
    case "bundle":
      // Implementation for bundle discount type
      break;
    case "first_time":
      const userOrders = await db
        .collection("orders")
        .countDocuments({ userId });
      if (userOrders === 0) {
        totalDiscount = (totalPurchase * discount.value) / 100;
      }
      break;
    case "loyalty":
      // Implementation for loyalty discount type
      break;
  }

  await db
    .collection(COLLECTION_NAME)
    .updateOne({ _id: discount._id }, { $inc: { currentUses: 1 } });

  return totalDiscount;
};

const searchDiscounts = async (query, seller_id) => {
  const db = getDB();
  const searchCriteria = { seller_id };

  if (query.name) searchCriteria.name = { $regex: query.name, $options: "i" };
  if (query.code) searchCriteria.code = { $regex: query.code, $options: "i" };
  if (query.type) searchCriteria.type = query.type;
  if (query.isActive !== undefined)
    searchCriteria.isActive = query.isActive === "true";
  if (query.status) searchCriteria.status = query.status;
  if (query.startDate)
    searchCriteria.startDate = { $gte: new Date(query.startDate) };
  if (query.endDate) searchCriteria.endDate = { $lte: new Date(query.endDate) };

  return await db.collection(COLLECTION_NAME).find(searchCriteria).toArray();
};

const bulkCreateDiscounts = async (discounts, seller_id) => {
  const db = getDB();
  const validDiscounts = discounts
    .filter((discount) => {
      try {
        validateDiscount({ ...discount, seller_id });
        return true;
      } catch (error) {
        console.error(`Invalid discount: ${error.message}`);
        return false;
      }
    })
    .map((discount) => ({ ...discount, seller_id }));

  if (validDiscounts.length > 0) {
    return await db.collection(COLLECTION_NAME).insertMany(validDiscounts);
  }
  return { insertedCount: 0 };
};

const cloneDiscount = async (id, seller_id) => {
  const db = getDB();
  const sourceDiscount = await getDiscountById(id, seller_id);
  if (!sourceDiscount) throw new Error("Discount not found");

  const clonedDiscount = {
    ...sourceDiscount,
    _id: new ObjectId(),
    name: `${sourceDiscount.name} (Clone)`,
    code: `${sourceDiscount.code}_CLONE`,
    currentUses: 0,
    version: 1,
  };

  await db.collection(COLLECTION_NAME).insertOne(clonedDiscount);
  return clonedDiscount;
};

const getDiscountUsageStats = async (id, seller_id) => {
  const db = getDB();
  const discount = await getDiscountById(id, seller_id);
  if (!discount) throw new Error("Discount not found");

  const usageStats = await db
    .collection("orders")
    .aggregate([
      { $match: { "appliedDiscounts.code": discount.code, seller_id } },
      {
        $group: {
          _id: null,
          totalUses: { $sum: 1 },
          totalDiscountAmount: { $sum: "$totalDiscount" },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ])
    .toArray();

  return (
    usageStats[0] || {
      totalUses: 0,
      totalDiscountAmount: 0,
      averageOrderValue: 0,
    }
  );
};

const scheduleDiscountActivation = async (
  id,
  activationDate,
  deactivationDate,
  seller_id
) => {
  const db = getDB();
  const updateObj = {};
  if (activationDate) updateObj.scheduleActivation = new Date(activationDate);
  if (deactivationDate)
    updateObj.scheduleDeactivation = new Date(deactivationDate);

  await db
    .collection(COLLECTION_NAME)
    .updateOne(
      { _id: new ObjectId(id), seller_id },
      { $set: updateObj, $inc: { version: 1 } }
    );
};

const updateDiscountStatuses = async () => {
  const db = getDB();
  const currentDate = moment().tz("Asia/Ho_Chi_Minh").toDate();
  console.log("Current date in Vietnam:", currentDate);

  // Update upcoming to active
  await db
    .collection(COLLECTION_NAME)
    .updateMany(
      { status: "upcoming", startDate: { $lte: currentDate } },
      { $set: { status: "active" }, $inc: { version: 1 } }
    );

  // Update active to expired
  await db
    .collection(COLLECTION_NAME)
    .updateMany(
      { status: "active", endDate: { $lt: currentDate } },
      { $set: { status: "expired" }, $inc: { version: 1 } }
    );
};

// Điều chỉnh cron job để chạy vào đúng thời điểm theo giờ Việt Nam
cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      await updateDiscountStatuses();
      console.log("Discount statuses updated successfully");
    } catch (error) {
      console.error("Error updating discount statuses:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);

module.exports = {
  createDiscount,
  getAllDiscounts,
  getActiveDiscounts,
  getExpiredDiscounts,
  getInactiveDiscounts,
  getUpcomingDiscounts,
  getTopUsedDiscounts,
  getDiscountById,
  updateDiscountName,
  updateDiscountStatus,
  updateDiscountApplicability,
  deleteDiscount,
  applyDiscount,
  searchDiscounts,
  bulkCreateDiscounts,
  cloneDiscount,
  getDiscountUsageStats,
  scheduleDiscountActivation,
  updateDiscountStatuses,
};
