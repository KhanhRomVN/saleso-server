const { ProductModel, DiscountModel } = require("../../models/index");
const logger = require("../../config/logger");
const { redisClient } = require("../../config/redisClient");

const createDescriptionDiscount = (discount) => {
  if (!discount) return null;

  switch (discount.type) {
    case "percentage":
      return `Discount ${discount.value}%`;
    case "fixed":
      return `Discount $${discount.value}`;
    case "buy_x_get_y":
      return `Buy ${discount.value.buyQuantity} Get ${discount.value.getFreeQuantity} Free`;
    case "flash-sale":
      return `Flash Sale ${discount.value}%`;
    default:
      return "Invalid discount type";
  }
};

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

const clearProductCache = async (productId) => {
  const keys = await redisClient.keys(`product:*${productId}*`);
  if (keys.length > 0) await redisClient.del(keys);
};

const ProductController = {
  createProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const productData = {
        ...req.body,
        seller_id: req.user._id.toString(),
        upcoming_discounts: [],
        ongoing_discounts: [],
        expired_discounts: [],
      };
      const newProduct = await ProductModel.createProduct(productData);
      await clearProductCache(newProduct._id);
      return { message: "Product added successfully", product: newProduct };
    }),

  getProductById: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getProductByProdId(req.params.product_id)
    ),

  getProductsBySellerId: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getListProductBySellerId(req.params.seller_id)
    ),

  getProductsWithDiscountBySellerId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const products = await ProductModel.getListProductBySellerId(
        req.params.seller_id
      );

      const productsWithDiscounts = await Promise.all(
        products.map(async (product) => {
          const discountArrays = [
            "upcoming_discounts",
            "ongoing_discounts",
            "expired_discounts",
          ];
          const discountsWithDescription = {};

          for (const arrayName of discountArrays) {
            discountsWithDescription[arrayName] = await Promise.all(
              product[arrayName].map(async (discountId) => {
                const discount =
                  await DiscountModel.getDiscountById(discountId);
                if (discount) {
                  discount.description = createDescriptionDiscount(discount);
                }
                return discount;
              })
            );
          }

          return {
            ...product,
            ...discountsWithDescription,
          };
        })
      );

      return productsWithDiscounts;
    }),

  getProductsByCategory: (req, res) =>
    handleRequest(req, res, async (req) =>
      ProductModel.getListProductByCategory(req.params.category)
    ),

  getAllProducts: (req, res) =>
    handleRequest(req, res, async (req) => ProductModel.getAllProducts()),

  updateProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const product = await checkUserOwnership(
        req.params.product_id,
        req.user._id.toString()
      );
      const updatedProduct = await ProductModel.updateProduct(
        req.params.product_id,
        req.body
      );
      await clearProductCache(req.params.product_id);
      return {
        message: "Product updated successfully",
        product: updatedProduct,
      };
    }),

  deleteProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      await checkUserOwnership(req.params.product_id, req.user._id.toString());
      await ProductModel.deleteProduct(req.params.product_id);
      await clearProductCache(req.params.product_id);
      return { message: "Product deleted successfully" };
    }),
};

module.exports = ProductController;
