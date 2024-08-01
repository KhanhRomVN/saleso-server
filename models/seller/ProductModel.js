const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

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
  applied_discounts: Joi.array().items(Joi.string()),
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
      if (!ObjectId.isValid(product_id)) {
        throw new Error("Invalid product ID");
      }
      return collection.findOne({ _id: new ObjectId(product_id) });
    }),

  getListProductBySellerId: async (seller_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(seller_id)) {
        throw new Error("Invalid seller ID");
      }
      return collection.find({ seller_id: seller_id }).toArray();
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
    handleDBOperation(async (collection) =>
      collection.find({ category: { $in: [category] } }).toArray()
    ),

  getProductsOnFlashSale: async () =>
    handleDBOperation(async (collection) => {
      const now = new Date();
      const nowISO = now.toISOString();

      return collection
        .find({
          discount_type: "Flash Sale",
          "discount_time.start": { $lte: nowISO },
          "discount_time.end": { $gt: nowISO },
          is_active: "Y",
        })
        .toArray();
    }),

  getAllProduct: async () =>
    handleDBOperation(async (collection) => collection.find({}).toArray()),

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
      return result;
    }),

  subtractStock: async (product_id, quantity) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) {
        throw new Error("Invalid product ID");
      }
      const product = await collection.findOne({
        _id: new ObjectId(product_id),
      });
      if (!product) {
        throw new Error("Product not found");
      }

      const newStock = product.stock - quantity;
      if (newStock < 0) {
        throw new Error("Insufficient stock");
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(product_id) },
        { $set: { stock: newStock, updatedAt: new Date() } }
      );

      if (result.modifiedCount === 0) {
        throw new Error("Failed to update stock");
      }

      return { ...product, stock: newStock };
    }),
};

module.exports = ProductModel;
