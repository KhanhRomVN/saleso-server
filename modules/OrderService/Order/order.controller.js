const {
  OrderModel,
  ProductModel,
  PaymentModel,
  CartModel,
} = require("../../../models");
const logger = require("../../../config/logger");
const { getDB, startSession } = require("../../../config/mongoDB");

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
      console.log(req.body);

      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error("Invalid order items");
      }

      const session = await startSession();

      try {
        let createdOrderIds;

        await session.withTransaction(async () => {
          // 1. Process orders and update stock
          const processedOrders = await Promise.all(
            orderItems.map(async (item) => {
              const product = await ProductModel.getProductById(item.product_id, session);
              if (!product) {
                throw new Error(`Product not found: ${item.product_id}`);
              }

              await ProductModel.updateStock(item.product_id, -item.quantity, item.sku, session);

              return {
                ...item,
                customer_id,
                seller_id: product.seller_id,
                order_status: "pending",
              };
            })
          );

          // 2. Create orders
          createdOrderIds = await OrderModel.createOrders(processedOrders, customer_id, session);

          // 3. Create payments
          await Promise.all(
            createdOrderIds.map(async (order) => {
              const paymentData = {
                order_id: order.order_id,
                customer_id,
                seller_id: order.seller_id,
                method: payment_method,
                status: payment_status,
              };
              await PaymentModel.createPayment(paymentData, session);
            })
          );

          // 4. Remove items from cart
          await Promise.all(
            orderItems.map(async (item) => {
              await CartModel.removeItem(customer_id, item.product_id, session);
            })
          );

          logger.info(`Orders created successfully for customer ${customer_id}`);
        });

        return { 
          message: "Order created successfully", 
          orderIds: createdOrderIds.map(order => order.order_id) 
        };
      } catch (error) {
        logger.error(`Error creating order for customer ${customer_id}: ${error.message}`);
        throw error;
      } finally {
        await session.endSession();
      }
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
