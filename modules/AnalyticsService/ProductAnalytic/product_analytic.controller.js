const { ProductAnalyticModel } = require("../../../models");
const logger = require("../../../config/logger");

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

const CartController = {
  // Only used when the seller creates a new product
  createNewProductAnalytic: async (product_id) => {
    // tạo thêm month và year
    const productAnalyticData = {
      product_id,
      month,
      year,
      total_view: 0,
      total_favorite: 0,
      total_cart: 0,
      total_sell: 0,
      total_revenue: 0,
      discount_used: 0,
      total_return: 0,
      return_rate: 0,
    };
    await ProductAnalyticModel.createNewProductAnalytic(productAnalyticData);
  },

  updateViewProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      await ProductAnalyticModel.viewProduct(product_id);
    }),

  // adds value when customers add products to their wishlist
  updateWishlistProduct: async (product_id) => {},
  // adds value when customers add products to their cart list
  updateCartProduct: async (product_id) => {},
  // Add more value when customers place orders successfully
  updateSellProduct: async (product_id, order_id, country) => {},
  updateDiscountUsed: async (product_id) => {},
  updateReturnProduct: async (product_id) => {},
};

module.exports = CartController;
