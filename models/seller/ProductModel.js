const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "products";

class ProductModel {
  static productSchema = Joi.object({
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

  static async handleDBOperation(operation) {
    const db = getDB();
    try {
      return await operation(db.collection(COLLECTION_NAME));
    } catch (error) {
      console.error(`Error in ${operation.name}: `, error);
      throw error;
    }
  }

  static async createProduct(productData) {
    return this.handleDBOperation(async (collection) => {
      const { error, value } = this.productSchema.validate(productData, {
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
  }

  static async getProductByProdId(product_id) {
    return this.handleDBOperation(async (collection) =>
      collection.findOne({ _id: new ObjectId(product_id) })
    );
  }

  static async getListProductBySellerId(seller_id) {
    return this.handleDBOperation(async (collection) =>
      collection.find({ seller_id }).toArray()
    );
  }

  static async getListProductByCategory(category) {
    return this.handleDBOperation(async (collection) =>
      collection.find({ category }).toArray()
    );
  }

  static async getAllProduct() {
    return this.handleDBOperation(async (collection) =>
      collection.find({}).toArray()
    );
  }

  static async updateProduct(product_id, updateData) {
    return this.handleDBOperation(async (collection) => {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(product_id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      if (!result) {
        throw new Error("Product not found or update failed");
      }

      return result;
    });
  }

  static async deleteProduct(product_id) {
    return this.handleDBOperation(async (collection) => {
      const result = await collection.deleteOne({
        _id: new ObjectId(product_id),
      });
      if (result.deletedCount === 0) throw new Error("Product not found");
      return result;
    });
  }

  static async subtractStock(product_id, quantity) {
    return this.handleDBOperation(async (collection) => {
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
  }
}

module.exports = ProductModel;
