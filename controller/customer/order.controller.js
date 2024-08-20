const {
  OrderModel,
  ProductModel,
  PaymentModel,
} = require("../../models/index");
const logger = require("../../config/logger");
const { error } = require("winston");

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
      const { orderItems, payment_method, payment_status } = req.body;

      // update stock product
      await Promise.all(
        orderItems.map(async (item) => {
          await ProductModel.updateStock(
            item.product_id,
            item.quantity,
            item.selected_attributes_value
          );
        })
      );

      // create order
      const processedOrders = await Promise.all(
        orderItems.map(async (item) => {
          const product = await ProductModel.getProductByProdId(
            item.product_id
          );

          return {
            ...item,
            customer_id,
            seller_id: product.seller_id,
            order_status: "pending",
          };
        })
      );

      const orderIds = await Promise.all(
        processedOrders.map(async (item) => {
          const { order_id, seller_id } = await OrderModel.createOrder(item);
          return {
            order_id,
            seller_id,
          };
        })
      );

      // create payment
      await Promise.all(
        orderIds.map(async (order) => {
          const paymentData = {
            ...order,
            customer_id,
            payment_method,
            payment_status,
          };
          return await PaymentModel.createPayment(paymentData);
        })
      );

      // drop product cart

      return { message: "Create Order Successful" };
    }),

  getListOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { status } = req.params;
      const id = req.user._id.toString();
      const role = req.user.role;

      let orders = await OrderModel.getListOrder(id, role, status);

      const orderPromises = orders.map(async (order) => {
        if (order.product_id) {
          const product = await ProductModel.getProductByProdId(
            order.product_id
          );
          if (product) {
            return {
              ...order,
              product_name: product.name,
              product_image:
                product.images && product.images.length > 0
                  ? product.images[0]
                  : null,
            };
          }
        }
        return order;
      });

      orders = await Promise.all(orderPromises);

      return orders;
    }),

  getOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { order_id } = req.params;
      return await OrderModel.getOrder(order_id);
    }),

  cancelOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { order_id } = req.params;
      const customer_id = req.user._id.toString();
      const orderData = await OrderModel.getOrder(order_id);
      if (customer_id !== orderData.customer_id) {
        return { error: "You can not cancel this order" };
      }
      await OrderModel.cancelOrder(order_id, customer_id);
      return { message: "Order cancel successfully" };
    }),
};

module.exports = OrderController;
