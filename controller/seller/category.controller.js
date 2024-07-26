const { CategoryModel, ProductModel } = require("../../models/index");
const logger = require("../../config/logger");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error in ${operation.name}: ${error}`);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

const getCategories = (req, res) =>
  handleRequest(req, res, async () => {
    const categories = await CategoryModel.getCategories();
    const categoriesWithProductCount = await Promise.all(
      categories.map(async (category) => {
        const { count } = await ProductModel.getNumberProductByCategory(
          category.name
        );
        return { ...category, number_product: count };
      })
    );
    return categoriesWithProductCount;
  });

const createCategory = (req, res) =>
  handleRequest(req, res, async (req) => {
    const { path } = req.body;
    if (!Array.isArray(path) || path.length === 0) {
      throw new Error("Invalid category path");
    }
    return await CategoryModel.createCategory(path);
  });

const getCategoryById = (req, res) =>
  handleRequest(
    req,
    res,
    async (req) => await CategoryModel.getCategoryById(req.params.id)
  );

const getChildrenCategories = (req, res) =>
  handleRequest(
    req,
    res,
    async (req) => await CategoryModel.getChildrenCategories(req.params.value)
  );

const updateCategory = (req, res) =>
  handleRequest(
    req,
    res,
    async (req) => await CategoryModel.updateCategory(req.params.id, req.body)
  );

const deleteCategory = (req, res) =>
  handleRequest(
    req,
    res,
    async (req) => await CategoryModel.deleteCategory(req.params.id)
  );

module.exports = {
  getCategories,
  createCategory,
  getCategoryById,
  getChildrenCategories,
  updateCategory,
  deleteCategory,
};
