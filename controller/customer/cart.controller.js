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

      if (!cart || !cart.items || cart.items.length === 0) {
        return { ...cart, items: [] };
      }

      const itemsWithDetails = await Promise.all(
        cart.items.map(async (item) => {
          try {
            const product = await ProductModel.getProductByProdId(
              item.productId
            );

            if (!product) {
              logger.warn(`Product not found for id: ${item.productId}`);
              return null;
            }

            let price;
            let stock = 0;

            if (product.attributes) {
              const allPrices = [];
              let totalStock = 0;

              Object.values(product.attributes).forEach((attribute) => {
                if (Array.isArray(attribute)) {
                  attribute.forEach((variant) => {
                    const variantPrice = parseFloat(variant.price);
                    const variantQuantity = parseInt(variant.quantity);

                    if (!isNaN(variantPrice)) {
                      allPrices.push(variantPrice);
                    }

                    if (!isNaN(variantQuantity)) {
                      totalStock += variantQuantity;
                    }
                  });
                }
              });

              if (allPrices.length > 0) {
                price = {
                  min: Math.min(...allPrices),
                  max: Math.max(...allPrices),
                };
              }

              stock = totalStock;
            } else if (typeof product.price === "number") {
              price = product.price;
            }

            if (typeof product.stock === "number") {
              stock = product.stock;
            }

            return {
              ...item,
              product: {
                name: product.name,
                price: price,
                stock: stock,
                image:
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : undefined,
              },
            };
          } catch (error) {
            logger.error(
              `Error processing product for item: ${item.productId}`,
              error
            );
            return null;
          }
        })
      );

      const validItems = itemsWithDetails.filter((item) => item !== null);

      return {
        ...cart,
        items: validItems,
      };
    }),

  addItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { productId, quantity = 1 } = req.body;
      const customer_id = req.user._id.toString();
      await CartModel.addItem(customer_id, productId, quantity);
      return { message: "Item added to cart successfully" };
    }),

  updateItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { productId, quantity } = req.body;
      const customer_id = req.user._id.toString();
      if (quantity > 0) {
        await CartModel.updateItem(customer_id, productId, quantity);
      } else {
        await CartModel.removeItem(customer_id, productId);
      }
      return { message: "Cart updated successfully" };
    }),

  removeItem: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { productId } = req.params;
      const customer_id = req.user._id.toString();
      await CartModel.removeItem(customer_id, productId);
      return { message: "Item removed from cart successfully" };
    }),

  clearCart: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      await CartModel.clearCart(customer_id);
      return { message: "Cart cleared successfully" };
    }),
};

module.exports = CartController;
