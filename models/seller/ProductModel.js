const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");
const DiscountModel = require("./DiscountModel");
const { client } = require("../../config/elasticsearchClient");
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
      const product = await collection.findOne({
        _id: new ObjectId(product_id),
      });
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

      const count = await collection.countDocuments({
        category: { $in: [category] },
        is_active: "Y",
      });

      return { category, count };
    }),

  getListProductByCategory: async (category) =>
    handleDBOperation(async (collection) => {
      if (!category || typeof category !== "string") {
        throw new Error("Invalid category");
      }

      const products = await collection
        .find({ categories: { $in: [category] }, is_active: "Y" })
        .toArray();

      return products;
    }),

  getProductsByCategories: async (categories) =>
    handleDBOperation(async (collection) => {
      if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error("Invalid categories input");
      }
      const products = await collection
        .find({
          categories: { $in: categories },
          is_active: "Y",
        })
        .toArray();
      return products;
    }),

  getAllProduct: async (page = 1, limit = 10) =>
    handleDBOperation(async (collection) => {
      const skip = (page - 1) * limit;

      const products = await collection
        .find({ is_active: "Y" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments({ is_active: "Y" });

      const result = {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      };

      return result;
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
      await redisClient.del(`product:${product_id}`);
      return result;
    }),

  updateDiscountStatuses: async () => {
    return handleDBOperation(async (collection) => {
      const currentDate = new Date();

      const products = await collection
        .find({
          $or: [
            { upcoming_discounts: { $exists: true, $ne: [] } },
            { ongoing_discounts: { $exists: true, $ne: [] } },
            { expired_discounts: { $exists: true, $ne: [] } },
          ],
        })
        .toArray();

      for (const product of products) {
        let updated = false;
        const updateOps = {};

        // Check upcoming discounts
        if (
          product.upcoming_discounts &&
          product.upcoming_discounts.length > 0
        ) {
          const discounts = await DiscountModel.getDiscountsByIds(
            product.upcoming_discounts
          );
          const ongoing = discounts.filter(
            (d) => d.startDate <= currentDate && d.endDate > currentDate
          );
          const expired = discounts.filter((d) => d.endDate <= currentDate);

          if (ongoing.length > 0) {
            updateOps.$push = {
              ongoing_discounts: {
                $each: ongoing.map((d) => d._id.toString()),
              },
            };
            updateOps.$pull = {
              upcoming_discounts: { $in: ongoing.map((d) => d._id.toString()) },
            };
            updated = true;
          }

          if (expired.length > 0) {
            updateOps.$push = updateOps.$push || {};
            updateOps.$pull = updateOps.$pull || {};
            updateOps.$push.expired_discounts = {
              $each: expired.map((d) => d._id.toString()),
            };
            updateOps.$pull.upcoming_discounts = {
              $in: expired.map((d) => d._id.toString()),
            };
            updated = true;
          }
        }

        // Check ongoing discounts
        if (product.ongoing_discounts && product.ongoing_discounts.length > 0) {
          const discounts = await DiscountModel.getDiscountsByIds(
            product.ongoing_discounts
          );
          const expired = discounts.filter((d) => d.endDate <= currentDate);

          if (expired.length > 0) {
            updateOps.$push = updateOps.$push || {};
            updateOps.$pull = updateOps.$pull || {};
            updateOps.$push.expired_discounts = {
              $each: expired.map((d) => d._id.toString()),
            };
            updateOps.$pull.ongoing_discounts = {
              $in: expired.map((d) => d._id.toString()),
            };
            updated = true;
          }
        }

        if (updated) {
          await collection.updateOne({ _id: product._id }, updateOps);
          await redisClient.del(`product:${product._id}`);
        }
      }

      await redisClient.del("allProducts");
    });
  },

  getFlashSaleProduct: async () =>
    handleDBOperation(async (collection) => {
      const now = new Date();
      const flashSaleProducts = await collection
        .find({
          ongoing_discounts: { $exists: true, $ne: [] },
          is_active: "Y",
        })
        .toArray();

      const productsWithDiscounts = await Promise.all(
        flashSaleProducts.map(async (product) => {
          const discounts = await DiscountModel.getDiscountsByIds(
            product.ongoing_discounts
          );
          const flashSaleDiscount = discounts.find(
            (d) =>
              d.type === "flash-sale" && d.startDate <= now && d.endDate > now
          );
          if (flashSaleDiscount) {
            return { ...product, flashSaleDiscount };
          }
          return null;
        })
      );

      return productsWithDiscounts.filter(Boolean);
    }),

  getTopSellProduct: async (limit = 10) =>
    handleDBOperation(async (collection) => {
      const topProducts = await collection
        .find({ is_active: "Y" })
        .sort({ units_sold: -1 })
        .limit(limit)
        .toArray();

      return topProducts;
    }),

  updateStock: async (productId, quantity) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID");
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(productId) },
        {
          $inc: { stock: -quantity, units_sold: quantity },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Product not found or update failed");
      }

      return result.value;
    }),

  syncProductToES: async (productId) =>
    handleDBOperation(async (collection) => {
      const product = await ProductModel.getProductByProdId(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const esProduct = {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        categories: product.categories,
        brand: product.brand,
        isHandmade: product.isHandmade,
        countryOfOrigin: product.countryOfOrigin,
        attributes: product.attributes,
        commonAttributes: product.commonAttributes,
      };

      await client.index({
        index: "products",
        id: esProduct.id,
        body: esProduct,
      });
    }),
};

cron.schedule("* * * * *", async () => {
  try {
    await DiscountModel.updateDiscountStatuses();
    await ProductModel.updateDiscountStatuses();
  } catch (error) {
    console.error("Error updating discount statuses:", error);
  }
});

module.exports = ProductModel;
