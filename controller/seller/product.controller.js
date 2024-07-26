const { ProductModel } = require("../../models/index");
const logger = require("../../config/logger");
const { ObjectId } = require("mongodb");

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

const checkUserOwnership = async (product_id, seller_id) => {
  const product = await ProductModel.getProductByProdId(product_id);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }
  if (product.seller_id.toString() !== seller_id.toString()) {
    const error = new Error("Unauthorized: You don't own this product");
    error.status = 403;
    throw error;
  }
  return product;
};

const createProduct = (req, res) => {
  return handleRequest(req, res, async (req) => {
    const productData = {
      ...req.body,
      seller_id: req.user._id.toString(),
    };
    const newProduct = await ProductModel.createProduct(productData);
    return { message: "Product added successfully", product: newProduct };
  });
};

const getProductById = (req, res) => {
  return handleRequest(req, res, async (req) =>
    ProductModel.getProductByProdId(req.params.product_id)
  );
};

const getProductsBySellerId = (req, res) => {
  return handleRequest(req, res, async (req) =>
    ProductModel.getListProductBySellerId(req.params.seller_id)
  );
};

const getProductsByCategory = (req, res) => {
  return handleRequest(req, res, async (req) => {
    return ProductModel.getListProductByCategory(req.params.category);
  });
};

const getProductsFlashsale = (req, res) => {
  return handleRequest(
    req,
    res,
    async () => await ProductModel.getProductsOnFlashSale()
  );
};

const getAllProducts = (req, res) => {
  return handleRequest(req, res, async () => ProductModel.getAllProduct());
};

const updateProduct = (req, res) => {
  return handleRequest(req, res, async (req) => {
    await checkUserOwnership(req.params.product_id, req.user._id.toString());
    const updatedProduct = await ProductModel.updateProduct(
      req.params.product_id,
      req.body
    );
    return {
      message: "Product updated successfully",
      product: updatedProduct,
    };
  });
};

const deleteProduct = (req, res) => {
  return handleRequest(req, res, async (req) => {
    await checkUserOwnership(req.params.product_id, req.user._id.toString());
    await ProductModel.deleteProduct(req.params.product_id);
    return { message: "Product deleted successfully" };
  });
};

module.exports = {
  createProduct,
  getProductById,
  getProductsBySellerId,
  getProductsByCategory,
  getProductsFlashsale,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
