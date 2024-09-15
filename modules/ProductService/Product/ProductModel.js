const Joi = require("joi");
const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");
const DiscountModel = require("../../../modules/ProductService/Discount/DiscountModel");
const cron = require("node-cron");
const { client } = require("../../../config/elasticsearchClient");
const { redisClient } = require("../../../config/redisClient");
const { remove } = require("winston");
const REDIS_EXPIRE_TIME = 3600;

const COLLECTION_NAME = "products";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  images: Joi.array().items(Joi.string()).required(),
  description: Joi.string().allow(""),
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

  getUniqueSlug: async (baseSlug) =>
    handleDBOperation(async (collection) => {
      let slugToTry = baseSlug;
      let slugExists = true;
      let counter = 1;

      while (slugExists) {
        const existingProduct = await collection.findOne({ slug: slugToTry });
        if (!existingProduct) {
          slugExists = false;
        } else {
          slugToTry = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      return slugToTry;
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

  getTopSellProduct: async (limit = 20) =>
    handleDBOperation(async (collection) => {
      return await collection
        .find({ is_active: "Y" })
        .sort({ units_sold: -1 })
        .limit(limit)
        .toArray();
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

  toggleActive: async (product_id) =>
    handleDBOperation(async (collection) => {
      const product = await collection.findOne({
        _id: new ObjectId(product_id),
      });

      const newActiveStatus = product.is_active === "Y" ? "N" : "Y";
      await collection.updateOne(
        { _id: new ObjectId(product_id) },
        { $set: { is_active: newActiveStatus, updated_at: new Date() } }
      );

      // // Update Elasticsearch
      // await client.update({
      //   index: "products",
      //   id: product_id,
      //   body: {
      //     doc: {
      //       is_active: newActiveStatus,
      //       updated_at: new Date(),
      //     },
      //   },
      // });

      // // Invalidate Redis cache
      // const cacheKey = `product:${product_id}`;
      // await redisClient.del(cacheKey);
    }),

    updateStock: async (product_id, quantity, sku) =>
      handleDBOperation(async (collection) => {
        if (!ObjectId.isValid(product_id)) {
          throw new Error("Invalid product ID");
        }
  
        const result = await collection.updateOne(
          {
            _id: new ObjectId(product_id),
            "variants.sku": sku,
            "variants.stock": { $gte: -quantity } 
          },
          {
            $inc: { "variants.$.stock": quantity },
            $set: { updated_at: new Date() },
          }
        );
  
        if (result.matchedCount === 0) {
          throw new Error("Product not found or insufficient stock");
        }
  
        return {
          message: "Stock updated successfully",
          modifiedCount: result.modifiedCount,
        };
      }),

  updateProduct: async (product_id, keys, values) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) {
        throw new Error("Invalid product ID");
      }

      if (keys.length !== values.length) {
        throw new Error("Keys and values arrays must have the same length");
      }

      const updateObj = {};
      for (let i = 0; i < keys.length; i++) {
        updateObj[keys[i]] = values[i];
      }

      updateObj.updated_at = new Date();

      const result = await collection.updateOne(
        { _id: new ObjectId(product_id) },
        { $set: updateObj }
      );

      if (result.matchedCount === 0) {
        throw new Error("Product not found");
      }

      // Update Elasticsearch
      await client.update({
        index: "products",
        id: product_id,
        body: {
          doc: updateObj,
        },
      });

      // Invalidate Redis cache
      const cacheKey = `product:${product_id}`;
      await redisClient.del(cacheKey);

      return {
        message: "Product updated successfully",
        modifiedCount: result.modifiedCount,
      };
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

  applyDiscount: async (product_id, discount_id, status) =>
    handleDBOperation(async (collection) => {
      let updateField;
      switch (status) {
        case "upcoming":
          updateField = "upcoming_discounts";
          break;
        case "ongoing":
          updateField = "ongoing_discounts";
          break;
        case "expired":
          updateField = "expired_discounts";
          break;
        default:
          throw new Error("Invalid discount status");
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(product_id) },
        {
          $addToSet: { [updateField]: discount_id },
          $set: { updated_at: new Date() },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error("Product not found");
      }

      if (result.modifiedCount === 0) {
        console.log(`Discount was already in the ${updateField} array`);
      }

      // Update Elasticsearch (uncomment when ready to use)
      // await client.update({
      //   index: "products",
      //   id: product_id,
      //   body: {
      //     script: {
      //       source: `
      //         if (!ctx._source.containsKey(params.updateField)) {
      //           ctx._source[params.updateField] = [];
      //         }
      //         if (!ctx._source[params.updateField].contains(params.discount_id)) {
      //           ctx._source[params.updateField].add(params.discount_id);
      //         }
      //         ctx._source.updated_at = params.updated_at;
      //       `,
      //       lang: "painless",
      //       params: {
      //         updateField,
      //         discount_id,
      //         updated_at: new Date().toISOString(),
      //       },
      //     },
      //   },
      // });

      // Invalidate Redis cache
      const cacheKey = `product:${product_id}`;
      await redisClient.del(cacheKey);

      return result;
    }),

  removeDiscount: async (product_id, discount_id, status) =>
    handleDBOperation(async (collection) => {
      let updateField;
      switch (status) {
        case "upcoming":
          updateField = "upcoming_discounts";
          break;
        case "ongoing":
          updateField = "ongoing_discounts";
          break;
        case "expired":
          updateField = "expired_discounts";
          break;
        default:
          throw new Error("Invalid discount status");
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(product_id) },
        {
          $pull: { [updateField]: discount_id },
          $set: { updated_at: new Date() },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error("Product not found");
      }

      if (result.modifiedCount === 0) {
        console.log(`Discount was not in the ${updateField} array`);
      }

      // Update Elasticsearch (uncomment when ready to use)
      // await client.update({
      //   index: "products",
      //   id: product_id,
      //   body: {
      //     script: {
      //       source: `
      //         if (ctx._source.containsKey(params.updateField)) {
      //           ctx._source[params.updateField].removeIf(id -> id == params.discount_id);
      //         }
      //         ctx._source.updated_at = params.updated_at;
      //       `,
      //       lang: "painless",
      //       params: {
      //         updateField,
      //         discount_id,
      //         updated_at: new Date().toISOString(),
      //       },
      //     },
      //   },
      // });

      // Invalidate Redis cache
      const cacheKey = `product:${product_id}`;
      await redisClient.del(cacheKey);

      return result;
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
