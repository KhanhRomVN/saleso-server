const { WishlistModel } = require("../../models/index");
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

const WishlistController = {
  getWishlist: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      return await WishlistModel.getWishlist(customer_id);
    }),

  addToWishlist: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const { product_id } = req.params;
      return await WishlistModel.addToWishlist(customer_id, product_id);
    }),

  removeFromWishlist: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const { product_id } = req.params;
      return await WishlistModel.removeFromWishlist(customer_id, product_id);
    }),

  clearWishlist: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      return await WishlistModel.clearWishlist(customer_id);
    }),
};

module.exports = WishlistController;
