const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "categories";

const CATEGORY_SCHEMA = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("").default(""),
  path: Joi.array().items(Joi.string()).required(),
  parentId: Joi.string().allow(null),
  children: Joi.array().items(Joi.string()),
  number_product: Joi.number().default(0),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateCategory = (categoryData) => {
  const { error } = CATEGORY_SCHEMA.validate(categoryData);
  if (error) throw error;
};

const CategoryModel = {
  getCategories: async () => {
    const db = getDB();
    return db.collection(COLLECTION_NAME).find().toArray();
  },

  createCategory: async (categoryPath, description = "") => {
    const db = getDB();
    let parentId = null;
    let currentPath = [];

    for (const categoryName of categoryPath) {
      currentPath.push(categoryName);
      const existingCategory = await db
        .collection(COLLECTION_NAME)
        .findOne({ path: currentPath });

      if (existingCategory) {
        parentId = existingCategory._id.toString();
      } else {
        const newCategory = {
          name: categoryName,
          description:
            currentPath.length === categoryPath.length ? description : "",
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

    return db.collection(COLLECTION_NAME).findOne({ path: currentPath });
  },

  getRootCategories: async () => {
    const db = getDB();
    return db.collection(COLLECTION_NAME).find({ parentId: null }).toArray();
  },

  getCategoryById: async (id) => {
    const db = getDB();
    return db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
  },

  getChildrenCategories: async (value) => {
    const db = getDB();
    const parent = ObjectId.isValid(value)
      ? await CategoryModel.getCategoryById(value)
      : await db.collection(COLLECTION_NAME).findOne({ name: value });

    if (!parent) throw new Error("Parent category not found");

    const childrenIds = parent.children.map((id) => new ObjectId(id));
    return db
      .collection(COLLECTION_NAME)
      .find({ _id: { $in: childrenIds } })
      .toArray();
  },

  updateCategory: async (id, updateData) => {
    const db = getDB();
    const { name, description } = updateData;

    if (!name && !description)
      throw new Error("Name or description is required for update");

    const category = await CategoryModel.getCategoryById(id);
    if (!category) throw new Error("Category not found");

    const updatedCategory = {
      ...category,
      name: name || category.name,
      description:
        description !== undefined ? description : category.description,
      updatedAt: new Date(),
    };

    validateCategory(updatedCategory);

    await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: updatedCategory.name,
          description: updatedCategory.description,
          updatedAt: updatedCategory.updatedAt,
        },
      }
    );

    return updatedCategory;
  },

  deleteCategory: async (categoryId) => {
    const db = getDB();
    const category = await CategoryModel.getCategoryById(categoryId);
    if (!category) throw new Error("Category not found");

    await CategoryModel.deleteCategoryRecursive(db, categoryId);

    if (category.parentId) {
      await db
        .collection(COLLECTION_NAME)
        .updateOne(
          { _id: new ObjectId(category.parentId) },
          { $pull: { children: categoryId } }
        );
    }

    return { message: "Category and all its subcategories have been deleted" };
  },

  deleteCategoryRecursive: async (db, categoryId) => {
    const category = await CategoryModel.getCategoryById(categoryId);
    if (!category) return;

    for (const childId of category.children) {
      await CategoryModel.deleteCategoryRecursive(db, childId);
    }

    await db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(categoryId) });
  },
};

module.exports = CategoryModel;
