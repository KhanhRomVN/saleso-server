const { OrderModel, ProductModel } = require("../../models/index");
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

const OrderController = {
  createOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const orderItems = req.body;

      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error(
          "Invalid order data. Expected a non-empty array of order items."
        );
      }

      const processedOrders = await Promise.all(
        orderItems.map(async (item) => {
          const product = await ProductModel.getProductByProdId(
            item.product_id
          );
          if (!product) {
            throw new Error(`Product not found for ID: ${item.product_id}`);
          }

          return {
            ...item,
            customer_id,
            seller_id: product.seller_id,
            order_status: "pending",
          };
        })
      );

      const createdOrders = await Promise.all(
        processedOrders.map(OrderModel.createOrder)
      );

      return {
        message: "Orders created successfully",
        orderIds: createdOrders,
      };
    }),

  getOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const role = req.user.role;
      const orders = await OrderModel.getOrder(customer_id, role);

      const ordersWithProductDetails = await Promise.all(
        orders.map(async (order) => {
          const product = await ProductModel.getProductByProdId(
            order.product_id
          );
          return {
            ...order,
            name: product.name,
            image: product.images[0] || null,
          };
        })
      );

      return ordersWithProductDetails;
    }),

  getAcceptOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      return await OrderModel.getListAcceptOrder(customer_id);
    }),

  getRefuseOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      return await OrderModel.getListRefuseOrder(customer_id);
    }),

  cancelOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();

      return { message: "Order cancel successfully" };
    }),
};

module.exports = OrderController;
