const { CartModel, ProductModel } = require("../../models/index");
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

const CartController = {
  getCart: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const cart = await CartModel.getCart(customer_id);

      // Remove createdAt and updatedAt
      const { createdAt, updatedAt, ...cartData } = cart;

      // Process items
      const processedItems = await Promise.all(
        cart.items.map(async (item) => {
          const product = await ProductModel.getProductByProdId(
            item.product_id
          );

          let processedItem = {
            product_id: product._id,
            name: product.name,
            image: product.images[0],
            quantity: item.quantity,
          };

          if (product.attributes) {
            // Product with attributes
            const selectedAttribute = product.attributes.find(
              (attr) => attr.attributes_value === item.selected_attributes_value
            );

            if (selectedAttribute) {
              processedItem.stock = selectedAttribute.attributes_quantity;
              processedItem.price = selectedAttribute.attributes_price;
              processedItem.selected_attributes_value =
                item.selected_attributes_value;
            }
          } else {
            // Product without attributes
            processedItem.stock = product.stock;
            processedItem.price = product.price;
          }

          return processedItem;
        })
      );

      return {
        ...cartData,
        items: processedItems,
      };
    }),

  addItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      await CartModel.addItem(customer_id, req.body);
      return { message: "Item added to cart successfully" };
    }),

  removeItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      const customer_id = req.user._id.toString();
      await CartModel.removeItem(customer_id, product_id);
      return { message: "Item removed from cart successfully" };
    }),

  updateItemQuantity: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const { product_id, quantity } = req.body;
      await CartModel.updateItemQuantity(customer_id, product_id, quantity);
      return { message: "Item quantity updated successfully" };
    }),

  clearCart: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      await CartModel.clearCart(customer_id);
      return { message: "Cart cleared successfully" };
    }),
};

module.exports = CartController;
