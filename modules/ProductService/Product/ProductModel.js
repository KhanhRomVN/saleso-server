const Joi = require("joi");
const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const DiscountModel = require("../../../modules/ProductService/Discount/DiscountModel");
const cron = require("node-cron");
const { client } = require("../../../config/elasticsearchClient");
const { redisClient } = require("../../../config/redisClient");
const REDIS_EXPIRE_TIME = 3600;

const COLLECTION_NAME = "products";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  images: Joi.array().items(Joi.string()).required(),
  description: Joi.string(),
  address: Joi.string().required(),
  origin: Joi.string().required(),
  categories: Joi.array().items(
    Joi.object({
      category_id: Joi.string().required(),
      category_name: Joi.string().required(),
    })
  ),
  details: Joi.array()
    .items(
      Joi.object({
        details_name: Joi.string().required(),
        details_info: Joi.string().required(),
      })
    )
    .min(0),
  tags: Joi.array().items(Joi.string()).required(),
  variants: Joi.array().items(
    Joi.object({
      sku: Joi.string().required(),
      stock: Joi.number().required(),
      price: Joi.number().required(),
    })
  ),
  upcoming_discounts: Joi.array().items(Joi.string()).required(),
  ongoing_discounts: Joi.array().items(Joi.string()).required(),
  expired_discounts: Joi.array().items(Joi.string()).required(),
  is_active: Joi.string().valid("Y", "N").default("Y"),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
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

const ProductModel = {
  createProduct: async (productData, seller_id) =>
    handleDBOperation(async (collection) => {
      const { error, value } = COLLECTION_SCHEMA.validate(productData, {
        abortEarly: false,
      });
      if (error) {
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );
      }

      const validatedProduct = {
        ...value,
        seller_id,
      };

      const result = await collection.insertOne(validatedProduct);
      const productElastic = {
        product_id: result.insertedId.toString(),
        ...value,
        seller_id,
      };

      // Add to Elasticsearch
      await client.index({
        index: "products",
        body: productElastic,
      });

      return {
        message: "Create Product Successfully",
        product_id: result.insertedId,
      };
    }),

  getProductById: async (product_id) => {
    const cacheKey = `product:${product_id}`;
    const cachedProduct = await redisClient.get(cacheKey);

    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    return handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) throw new Error("Invalid product ID");
      const product = await collection.findOne({
        _id: new ObjectId(product_id),
      });

      if (product) {
        await redisClient.set(cacheKey, JSON.stringify(product), {
          EX: parseInt(REDIS_EXPIRE_TIME),
        });
      }

      return product;
    });
  },

  getListProductBySellerId: async (seller_id) =>
    handleDBOperation(async (collection) => {
      return await collection.find({ seller_id: seller_id }).toArray();
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

  updateProduct: async (product_id, updateData) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) {
        throw new Error("Invalid product ID");
      }

      const { error, value } = COLLECTION_SCHEMA.validate(updateData, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(product_id) },
        {
          $set: {
            ...value,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          upsert: false,
        }
      );

      if (!result) {
        throw new Error("Product not found or update failed");
      }

      // Update in Elasticsearch
      await client.update({
        index: "products",
        id: product_id,
        body: {
          doc: {
            ...value,
            updatedAt: new Date(),
          },
        },
      });

      if (result) {
        const cacheKey = `product:${product_id}`;
        await redisClient.del(cacheKey);
        // Invalidate the getAllProduct cache
        const allProductsKeys = await redisClient.keys("allProducts:*");
        if (allProductsKeys.length > 0) {
          await redisClient.del(allProductsKeys);
        }
      }

      return result;
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

      // Delete from Elasticsearch
      await client.delete({
        index: "products",
        id: product_id,
      });

      if (result.deletedCount > 0) {
        const cacheKey = `product:${product_id}`;
        await redisClient.del(cacheKey);
        // Invalidate the getAllProduct cache
        const allProductsKeys = await redisClient.keys("allProducts:*");
        if (allProductsKeys.length > 0) {
          await redisClient.del(allProductsKeys);
        }
      }

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
        }
      }
    });
  },

  getFlashSaleProduct: async () =>
    handleDBOperation(async (collection) => {
      const products = await collection
        .find({
          ongoing_discounts: { $exists: true, $ne: [] },
          is_active: "Y",
        })
        .toArray();

      const flashSaleProducts = [];

      for (const product of products) {
        const discounts = await Promise.all(
          product.ongoing_discounts.map((id) =>
            DiscountModel.getDiscountById(id)
          )
        );

        const flashSaleDiscounts = discounts.filter(
          (d) => d.type === "flash-sale"
        );

        if (flashSaleDiscounts.length > 0) {
          const maxFlashSaleDiscount = flashSaleDiscounts.reduce(
            (max, discount) => (discount.value > max.value ? discount : max)
          );

          flashSaleProducts.push({
            ...product,
            discount_value: maxFlashSaleDiscount.value,
          });
        }
      }

      return flashSaleProducts;
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

  getProductsByListProductId: async (productIds) =>
    handleDBOperation(async (collection) => {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error("Invalid input: productIds must be a non-empty array");
      }

      // Convert string IDs to ObjectId
      const objectIds = productIds.map((id) => {
        if (!ObjectId.isValid(id)) {
          throw new Error(`Invalid product ID: ${id}`);
        }
        return new ObjectId(id);
      });

      // Fetch products from MongoDB
      const products = await collection
        .find({ _id: { $in: objectIds } })
        .toArray();

      // Check if all products were found
      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p._id.toString());
        const missingIds = productIds.filter((id) => !foundIds.includes(id));
        console.warn(`Some products were not found: ${missingIds.join(", ")}`);
      }

      return products;
    }),

  updateStock: async (productId, quantity, selected_attributes_value = null) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID");
      }

      const baseUpdate = {
        $inc: { units_sold: quantity },
        $set: { updatedAt: new Date() },
      };

      if (selected_attributes_value) {
        // Check attributes_quantity
        const product = await collection.findOne({
          _id: new ObjectId(productId),
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const attribute = product.attributes.find(
          (attr) => attr.attributes_value === selected_attributes_value
        );

        if (!attribute || attribute.attributes_quantity < quantity) {
          throw new Error("Insufficient stock for the selected attribute");
        }

        await collection.findOneAndUpdate(
          {
            _id: new ObjectId(productId),
            "attributes.attributes_value": selected_attributes_value,
          },
          {
            ...baseUpdate,
            $inc: {
              "attributes.$.attributes_quantity": -quantity,
            },
          },
          { returnDocument: "after" }
        );
      } else if (selected_attributes_value === null) {
        // Check stock
        const product = await collection.findOne({
          _id: new ObjectId(productId),
        });

        if (!product) {
          throw new Error("Product not found");
        }

        if (product.stock < quantity) {
          throw new Error("Insufficient stock");
        }

        await collection.findOneAndUpdate(
          { _id: new ObjectId(productId) },
          {
            ...baseUpdate,
            $inc: { stock: -quantity },
          },
          { returnDocument: "after" }
        );
      }
    }),

  refreshProduct: async () =>
    handleDBOperation(async (collection) => {
      // Delete all documents from the Elasticsearch index
      await client.deleteByQuery({
        index: "products",
        body: {
          query: {
            match_all: {},
          },
        },
      });

      // Fetch all products from MongoDB
      const products = await collection.find({}).toArray();
      const productsWithId = products.map((product) => ({
        ...product,
        product_id: product._id.toString(),
      }));

      // Bulk index all products in Elasticsearch
      const body = productsWithId.flatMap((doc) => [
        { index: { _index: "products", _id: doc._id.toString() } },
        {
          ...doc,
          _id: undefined,
        },
      ]);

      const bulkResponse = await client.bulk({ refresh: true, body });
      // const { body: bulkResponse } = await client.bulk({ refresh: true, body });

      if (bulkResponse.errors) {
        const erroredDocuments = [];
        bulkResponse.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: body[i * 2],
              document: body[i * 2 + 1],
            });
          }
        });
        console.error("Failed to index some documents", erroredDocuments);
      }

      // Refresh Redis cache
      const redisKeys = await redisClient.keys("product:*");
      if (redisKeys.length > 0) {
        await redisClient.del(redisKeys);
      }

      // Refresh all products cache in Redis
      for (const product of products) {
        const cacheKey = `product:${product._id}`;
        await redisClient.set(cacheKey, JSON.stringify(product), {
          EX: parseInt(REDIS_EXPIRE_TIME),
        });
      }

      // Invalidate and refresh the getAllProduct cache
      const allProductsKeys = await redisClient.keys("allProducts:*");
      if (allProductsKeys.length > 0) {
        await redisClient.del(allProductsKeys);
      }

      return {
        message: "Products data refreshed in Elasticsearch and Redis cache",
      };
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
