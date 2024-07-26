const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "products";

const productSchema = Joi.object({
  seller_id: Joi.string().required(),
  name: Joi.string().required(),
  images: Joi.array().items(Joi.string()).required(),
  description: Joi.string().required(),
  price: Joi.number().required().min(0),
  stock: Joi.number().required().min(0),
  category: Joi.array().items(Joi.string()).required(),
  discount: Joi.string().allow(""),
  discount_type: Joi.string().allow(""),
  discount_name: Joi.string().allow(""),
  discount_time: Joi.object({
    start: Joi.string().allow(""),
    end: Joi.string().allow(""),
  }).allow({}),
  property_data: Joi.array().items(
    Joi.object({
      propertyName: Joi.string().required(),
      propertyDescription: Joi.string().allow(""),
      propertyValue: Joi.array().items(Joi.string()).required(),
    })
  ),
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

const createProduct = async (productData) => {
  return handleDBOperation(async (collection) => {
    const { error, value } = productSchema.validate(productData, {
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
  });
};

const getProductByProdId = async (product_id) => {
  return handleDBOperation(async (collection) => {
    if (!ObjectId.isValid(product_id)) {
      throw new Error("Invalid product ID");
    }
    return collection.findOne({ _id: new ObjectId(product_id) });
  });
};

const getListProductBySellerId = async (seller_id) => {
  return handleDBOperation(async (collection) => {
    if (!ObjectId.isValid(seller_id)) {
      throw new Error("Invalid seller ID");
    }
    return collection.find({ seller_id: seller_id }).toArray();
  });
};

const getNumberProductByCategory = async (category) => {
  return handleDBOperation(async (collection) => {
    if (!category || typeof category !== "string") {
      throw new Error("Invalid category");
    }

    const count = await collection.countDocuments({
      category: { $in: [category] },
      is_active: "Y",
    });

    return { category, count };
  });
};

const getListProductByCategory = async (category) => {
  return handleDBOperation(async (collection) =>
    collection.find({ category: { $in: [category] } }).toArray()
  );
};

const getProductsOnFlashSale = async () => {
  return handleDBOperation(async (collection) => {
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
  });
};

const getAllProduct = async () => {
  return handleDBOperation(async (collection) => collection.find({}).toArray());
};

const updateProduct = async (product_id, updateData) => {
  return handleDBOperation(async (collection) => {
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
  });
};

const deleteProduct = async (product_id) => {
  return handleDBOperation(async (collection) => {
    if (!ObjectId.isValid(product_id)) {
      throw new Error("Invalid product ID");
    }
    const result = await collection.deleteOne({
      _id: new ObjectId(product_id),
    });
    if (result.deletedCount === 0) throw new Error("Product not found");
    return result;
  });
};

const subtractStock = async (product_id, quantity) => {
  return handleDBOperation(async (collection) => {
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
  });
};

module.exports = {
  createProduct,
  getProductByProdId,
  getListProductBySellerId,
  getProductsOnFlashSale,
  getNumberProductByCategory,
  getListProductByCategory,
  getAllProduct,
  updateProduct,
  deleteProduct,
  subtractStock,
};
