const { ProductModel } = require("../../models/index");
const logger = require("../../config/logger");

class ProductController {
  static async handleRequest(req, res, operation) {
    try {
      const result = await operation(req);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in ${operation.name}: ${error}`);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Internal Server Error" });
    }
  }

  static async checkUserOwnership(product_id, seller_id) {
    const product = await ProductModel.getProductByProdId(product_id);
    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }
    if (product.seller_id !== seller_id) {
      const error = new Error("Unauthorized: You don't own this product");
      error.status = 403;
      throw error;
    }
    return product;
  }

  static createProduct(req, res) {
    return ProductController.handleRequest(req, res, async (req) => {
      const productData = { ...req.body, seller_id: req.user._id.toString() };
      const newProduct = await ProductModel.createProduct(productData);
      return { message: "Product added successfully", product: newProduct };
    });
  }

  static getProductById(req, res) {
    return ProductController.handleRequest(req, res, async (req) =>
      ProductModel.getProductByProdId(req.params.product_id)
    );
  }

  static getProductsBySellerId(req, res) {
    return ProductController.handleRequest(req, res, async (req) =>
      ProductModel.getListProductBySellerId(req.params.seller_id)
    );
  }

  static getProductsByCategory(req, res) {
    return ProductController.handleRequest(req, res, async (req) =>
      ProductModel.getListProductByCategory(req.params.category)
    );
  }

  static getAllProducts(req, res) {
    return ProductController.handleRequest(req, res, async () =>
      ProductModel.getAllProduct()
    );
  }

  static updateProduct(req, res) {
    return ProductController.handleRequest(req, res, async (req) => {
      await ProductController.checkUserOwnership(
        req.params.product_id,
        req.user._id.toString()
      );
      const updatedProduct = await ProductModel.updateProduct(
        req.params.product_id,
        req.body
      );
      return {
        message: "Product updated successfully",
        product: updatedProduct,
      };
    });
  }

  static deleteProduct(req, res) {
    return ProductController.handleRequest(req, res, async (req) => {
      await ProductController.checkUserOwnership(
        req.params.product_id,
        req.user._id.toString()
      );
      await ProductModel.deleteProduct(req.params.product_id);
      return { message: "Product deleted successfully" };
    });
  }
}

module.exports = ProductController;
