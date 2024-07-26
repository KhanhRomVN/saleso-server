const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "categories";

const COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required(),
  path: Joi.array().items(Joi.string()).required(),
  parentId: Joi.string().allow(null),
  children: Joi.array().items(Joi.string()),
  number_product: Joi.number().default(0),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateCategory = (categoryData) => {
  const { error } = COLLECTION_SCHEMA.validate(categoryData);
  if (error) throw error;
};

const getCategories = async () => {
  const db = getDB();
  return await db.collection(COLLECTION_NAME).find().toArray();
};

const createCategory = async (categoryPath) => {
  const db = getDB();
  let parentId = null;
  let currentPath = [];

  for (let categoryName of categoryPath) {
    currentPath.push(categoryName);
    const existingCategory = await db
      .collection(COLLECTION_NAME)
      .findOne({ path: currentPath });

    if (existingCategory) {
      parentId = existingCategory._id.toString();
    } else {
      const newCategory = {
        name: categoryName,
        path: [...currentPath],
        parentId,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      validateCategory(newCategory);
      const { insertedId } = await db
        .collection(COLLECTION_NAME)
        .insertOne(newCategory);
      const newCategoryId = insertedId.toString();

      if (parentId) {
        await db
          .collection(COLLECTION_NAME)
          .updateOne(
            { _id: new ObjectId(parentId) },
            { $push: { children: newCategoryId } }
          );
      }

      parentId = newCategoryId;
    }
  }

  return await db.collection(COLLECTION_NAME).findOne({ path: currentPath });
};

const getCategoryById = async (id) => {
  const db = getDB();
  return await db
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id) });
};

const getChildrenCategories = async (value) => {
  const db = getDB();
  let parent;

  // Check if value is an ObjectId
  if (ObjectId.isValid(value)) {
    parent = await getCategoryById(value);
  } else {
    // If not an ObjectId, assume it's a category name
    parent = await db.collection(COLLECTION_NAME).findOne({ name: value });
  }

  if (!parent) {
    throw new Error("Parent category not found");
  }

  const childrenIds = parent.children.map((id) => new ObjectId(id));
  return await db
    .collection(COLLECTION_NAME)
    .find({ _id: { $in: childrenIds } })
    .toArray();
};

const updateCategory = async (id, updateData) => {
  const db = getDB();
  const { name } = updateData;

  if (!name) throw new Error("Name is required for update");

  const category = await getCategoryById(id);
  if (!category) throw new Error("Category not found");

  const updatedCategory = {
    ...category,
    name,
    updatedAt: new Date(),
  };

  validateCategory(updatedCategory);

  await db
    .collection(COLLECTION_NAME)
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, updatedAt: new Date() } }
    );

  return updatedCategory;
};

const deleteCategory = async (categoryId) => {
  const db = getDB();
  const category = await getCategoryById(categoryId);
  if (!category) throw new Error("Category not found");

  await deleteCategoryRecursive(db, categoryId);

  if (category.parentId) {
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(category.parentId) },
        { $pull: { children: categoryId } }
      );
  }

  return { message: "Category and all its subcategories have been deleted" };
};

const deleteCategoryRecursive = async (db, categoryId) => {
  const category = await getCategoryById(categoryId);
  if (!category) return;

  for (const childId of category.children) {
    await deleteCategoryRecursive(db, childId);
  }

  await db
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(categoryId) });
};

module.exports = {
  getCategories,
  createCategory,
  getCategoryById,
  getChildrenCategories,
  updateCategory,
  deleteCategory,
};
