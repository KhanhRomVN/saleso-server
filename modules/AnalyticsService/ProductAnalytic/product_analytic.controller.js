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

const ProductAnalyticController = {
  createNewProductAnalytic: async (product_id) => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const productAnalyticData = {
      product_id,
      month,
      year,
      total_view: 0,
      total_wishlist: 0,
      total_cart: 0,
      total_sell: 0,
      total_revenue: 0,
      discount_used: 0,
      total_return: 0,
      return_rate: 0,
      country_destruction: [],
    };
    await ProductAnalyticModel.createNewProductAnalytic(productAnalyticData);
  },

  updateViewProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      await ProductAnalyticModel.updateViewProduct(product_id);
    }),
};

module.exports = ProductAnalyticController;
