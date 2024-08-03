const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");
const DiscountModel = require("./DiscountModel");
const { redisClient } = require("../../config/redisClient");
const cron = require("node-cron");

const COLLECTION_NAME = "products";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  name: Joi.string().required(),
  images: Joi.array().items(Joi.string()).required(),
  description: Joi.string(),
  price: Joi.number().min(0),
  countryOfOrigin: Joi.string().required(),
  brand: Joi.string(),
  isHandmade: Joi.boolean().valid(true, false).required(),
  stock: Joi.number().min(0),
  categories: Joi.array().items(Joi.string()).required(),
  upcoming_discounts: Joi.array().items(Joi.string()),
  ongoing_discounts: Joi.array().items(Joi.string()),
  expired_discounts: Joi.array().items(Joi.string()),
  attributes: Joi.object().pattern(
    Joi.string(),
    Joi.array()
      .items(
        Joi.object({
          value: Joi.string().required(),
          quantity: Joi.string().pattern(/^\d+$/).required(),
          price: Joi.string().pattern(/^\d+$/).required(),
        })
      )
      .min(1)
  ),
  commonAttributes: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        info: Joi.string().required(),
      })
    )
    .min(0),
  units_sold: Joi.number().default(0),
  is_active: Joi.string().valid("Y", "N").default("Y"),
});

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const ProductModel = {
  createProduct: async (productData) =>
    handleDBOperation(async (collection) => {
      const { error, value } = COLLECTION_SCHEMA.validate(productData, {
        abortEarly: false,
      });
      if (error) {
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );
      }

      const now = new Date();
      const validatedProduct = { ...value, createdAt: now, updatedAt: now };

      const result = await collection.insertOne(validatedProduct);
      return { ...validatedProduct, _id: result.insertedId };
    }),

  getProductByProdId: async (product_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) throw new Error("Invalid product ID");

      const cacheKey = `product:${product_id}`;
      const cachedProduct = await redisClient.get(cacheKey);
      if (cachedProduct) return JSON.parse(cachedProduct);

      const product = await collection.findOne({
        _id: new ObjectId(product_id),
      });
      if (product)
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
      return product;
    }),

  getListProductBySellerId: async (seller_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(seller_id)) throw new Error("Invalid seller ID");
      const products = await collection
        .find({ seller_id: seller_id })
        .toArray();
      return products;
    }),

  getNumberProductByCategory: async (category) =>
    handleDBOperation(async (collection) => {
      if (!category || typeof category !== "string") {
        throw new Error("Invalid category");
      }

      const cacheKey = `category:${category}:count`;
      const cachedCount = await redisClient.get(cacheKey);
      if (cachedCount) {
        return { category, count: parseInt(cachedCount) };
      }

      const count = await collection.countDocuments({
        category: { $in: [category] },
        is_active: "Y",
      });

      await redisClient.setEx(cacheKey, 3600, count.toString()); // Cache for 1 hour
      return { category, count };
    }),

  getListProductByCategory: async (category) =>
    handleDBOperation(async (collection) => {
      const cacheKey = `category:${category}:products`;
      const cachedProducts = await redisClient.get(cacheKey);
      if (cachedProducts) {
        return JSON.parse(cachedProducts);
      }
      const products = await collection
        .find({ categories: { $in: [category] } })
        .toArray();
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(products)); // Cache for 1 hour
      return products;
    }),

  getAllProducts: async () =>
    handleDBOperation(async (collection) => {
      const cacheKey = "allProducts";
      const cachedProducts = await redisClient.get(cacheKey);
      if (cachedProducts) {
        return JSON.parse(cachedProducts);
      }
      const products = await collection.find().toArray();
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(products)); // Cache for 1 hour
      return products;
    }),

  applyDiscount: async (productId, discountId) =>
    handleDBOperation(async (collection) => {
      await collection.updateOne(
        { _id: new ObjectId(productId) },
        { $addToSet: { applied_discounts: discountId } }
      );
    }),

  updateProduct: async (product_id, updateData) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) {
        throw new Error("Invalid product ID");
      }
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(product_id) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Product not found or update failed");
      }

      // Clear cache for this product
      await redisClient.del(`product:${product_id}`);

      return result.value;
    }),

  deleteProduct: async (product_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) {
        throw new Error("Invalid product ID");
      }
      const result = await collection.deleteOne({
        _id: new ObjectId(product_id),
      });
      if (result.deletedCount === 0) throw new Error("Product not found");

      // Clear cache for this product
      await redisClient.del(`product:${product_id}`);

      return result;
    }),

  updateDiscountStatuses: async () => {
    return handleDBOperation(async (collection) => {
      const activeProducts = await collection
        .find({ is_active: "Y" })
        .toArray();

      for (const product of activeProducts) {
        let upcomingUpdated = false;
        let ongoingUpdated = false;

        // Check upcoming_discounts
        for (const discountId of product.upcoming_discounts || []) {
          const discount = await DiscountModel.getDiscountById(discountId);
          if (discount && discount.status === "ongoing") {
            await collection.updateOne(
              { _id: product._id },
              {
                $pull: { upcoming_discounts: discountId },
                $addToSet: { ongoing_discounts: discountId },
              }
            );
            upcomingUpdated = true;
          }
        }

        // Check ongoing_discounts
        for (const discountId of product.ongoing_discounts || []) {
          const discount = await DiscountModel.getDiscountById(discountId);
          if (discount && discount.status === "expired") {
            await collection.updateOne(
              { _id: product._id },
              {
                $pull: { ongoing_discounts: discountId },
                $addToSet: { expired_discounts: discountId },
              }
            );
            ongoingUpdated = true;
          }
        }

        // Clear cache if updates were made
        if (upcomingUpdated || ongoingUpdated) {
          await redisClient.del(`product:${product._id}`);
        }
      }
    });
  },
};

cron.schedule("* * * * *", async () => {
  try {
    await DiscountModel.updateDiscountStatuses();
    await ProductModel.updateDiscountStatuses();
    console.log("Discount statuses updated successfully");
  } catch (error) {
    console.error("Error updating discount statuses:", error);
  }
});

module.exports = ProductModel;
