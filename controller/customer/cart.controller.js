const { CartModel } = require("../../models/index");
const logger = require("../../config/logger");

const addCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const user_id = req.user._id.toString();
  try {
    logger.info(`Adding product ${product_id} to cart for user ${user_id}`);
    await CartModel.addCart(user_id, product_id, quantity);
    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    logger.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getListProductOfCart = async (req, res) => {
  const user_id = req.user._id.toString();
  try {
    logger.info(`Fetching cart list for user ${user_id}`);
    const productList = await CartModel.getListProductOfCart(user_id);
    res.status(200).json({ productList });
  } catch (error) {
    logger.error("Error fetching carts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateCartQuantity = async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user._id.toString();
  try {
    logger.info(
      `Updating quantity for product ${product_id} in cart for user ${user_id}`
    );
    await CartModel.updateCartQuantity(user_id, product_id, quantity);
    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    logger.error("Error updating cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const delCart = async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user._id.toString();
  try {
    logger.info(`Deleting product ${product_id} from cart for user ${user_id}`);
    await CartModel.delCart(user_id, product_id);
    res.status(200).json({ message: "Product deleted from cart successfully" });
  } catch (error) {
    logger.error("Error deleting product from cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const delCarts = async (req, res) => {
  const { prodList } = req.body;
  const user_id = req.user._id.toString();
  try {
    logger.info(
      `Deleting products ${prodList.join(", ")} from cart for user ${user_id}`
    );
    await CartModel.delCarts(user_id, prodList);
    res
      .status(200)
      .json({ message: "Products deleted from cart successfully" });
  } catch (error) {
    logger.error("Error deleting products from cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addCart,
  getListProductOfCart,
  updateCartQuantity,
  delCart,
  delCarts,
};
