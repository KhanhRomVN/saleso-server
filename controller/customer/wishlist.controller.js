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
      const userId = req.user._id.toString();
      return await WishlistModel.getWishlist(userId);
    }),

  addItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { productId } = req.body;
      const userId = req.user._id.toString();
      await WishlistModel.addItem(userId, productId);
      return { message: "Item added to wishlist successfully" };
    }),

  removeItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { productId } = req.params;
      const userId = req.user._id.toString();
      await WishlistModel.removeItem(userId, productId);
      return { message: "Item removed from wishlist successfully" };
    }),

  clearWishlist: (req, res) =>
    handleRequest(req, res, async (req) => {
      const userId = req.user._id.toString();
      await WishlistModel.clearWishlist(userId);
      return { message: "Wishlist cleared successfully" };
    }),
};

module.exports = WishlistController;
