const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "categories";
const CATEGORY_SCHEMA = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  image_uri: Joi.string(),
  description: Joi.string(),
  parent_id: Joi.string(),
  level: Joi.number().required(),
  product_count: Joi.number().default(0),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateCategory = (categoryData) => {
  const { error } = CATEGORY_SCHEMA.validate(categoryData);
  if (error) throw error;
};

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const CategoryModel = {
  createNewCategoryBranch: async (categoryData) => {
    validateCategory(categoryData);
    return handleDBOperation(async (collection) => {
      const result = await collection.insertOne(categoryData);
      return result.insertedId;
    });
  },

  insertCategoryIntoHierarchy: async (categoryData) => {
    validateCategory(categoryData);
  },

  updateCategory: async (categoryId, categoryUpdate) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(categoryId) },
        { $set: { ...categoryUpdate, updated_at: new Date() } }
      );
      return result.modifiedCount;
    });
  },

  deleteCategory: async (categoryId) => {
    return handleDBOperation(async (collection) => {});
  },

  getAllCategoriesByLevel: async (level) => {
    return handleDBOperation(async (collection) => {
      return await collection.find({ level: parseInt(level) }).toArray();
    });
  },

  getAllCategoriesChildrenByParentId: async (parentId) => {
    return handleDBOperation(async (collection) => {
      return await collection.find({ parent_id: parentId }).toArray();
    });
  },
};

module.exports = CategoryModel;
