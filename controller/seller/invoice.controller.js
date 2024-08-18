const {
  InvoiceModel,
  OrderModel,
  UserModel,
  ProductModel,
  DiscountModel,
} = require("../../models/index");
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

const InvoiceController = {
  getListPendingOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      const role = req.user.role;
      const orders = await OrderModel.getOrder(seller_id, role);

      const processedOrders = await Promise.all(
        orders.map(async (order) => {
          const product = await ProductModel.getProductByProdId(
            order.product_id
          );
          const customer = await UserModel.getUserById(
            order.customer_id,
            "customer"
          );

          if (order.discount_id) {
            const discount = await DiscountModel.getDiscountById(
              order.discount_id
            );

            return {
              _id: order._id,
              image: product.images[0],
              name: product.name,
              username: customer.username,
              price: order.price,
              quantity: order.quantity,
              discount_type: discount.type,
              discount_value: discount.value,
              total: order.total,
              payment_method: order.payment_method,
              payment_status: order.payment_status,
            };
          }

          return {
            _id: order._id,
            image: product.images[0],
            name: product.name,
            username: customer.username,
            price: order.price,
            quantity: order.quantity,
            total: order.total,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
          };
        })
      );

      return processedOrders;
    }),

  getOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { order_id } = req.params;
      const order = await OrderModel.getOrderById(order_id);
      const product = await ProductModel.getProductByProdId(order.product_id);
      const customer = await UserModel.getUserById(
        order.customer_id,
        "customer"
      );
      const discount = await DiscountModel.getDiscountById(order.discount_id);

      const baseResponse = {
        order_id: order._id,
        customer_id: customer._id,
        username: customer.username,
        email: customer.email,
        product_id: product._id,
        name: product.name,
        image: product.images[0],
        shipping_address: order.shipping_address,
        price: order.price,
        quantity: order.quantity,
        total: order.total,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
      };

      return Object.assign(
        {},
        baseResponse,
        order.selected_attributes_value && {
          selected_attributes_value: order.selected_attributes_value,
        },
        discount?.type && { discount_type: discount.type },
        discount?.value && { discount_value: discount.value }
      );
    }),

  acceptOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { order_id, due_date } = req.body;
      const seller_id = req.user._id.toString();

      // auth
      const order = await OrderModel.getOrderById(order_id);
      console.log(order);
      if (!order || order.seller_id !== seller_id) {
        throw new Error("Order not found or not authorized");
      }

      // update status
      await OrderModel.updateOrderStatus(order_id, "accepted");

      const invoiceData = {
        seller_id,
        customer_id: order.customer_id,
        order_id,
        issue_date: new Date(),
        due_date: due_date
          ? due_date
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        logs: [`Successfully created invoice for order [${order_id}]`],
        invoice_status: "progress",
      };

      return await InvoiceModel.createInvoice(invoiceData);
    }),

  refuseOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { order_id } = req.body;
      const seller_id = req.user._id;

      const order = await OrderModel.getOrderById(order_id);
      if (!order || order.seller_id !== seller_id) {
        throw new Error("Order not found or not authorized");
      }

      return await OrderModel.updateOrderStatus(order_id, "refused");
    }),

  getListProgressInvoice: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      return await InvoiceModel.getInvoicesByStatus(seller_id, "progress");
    }),

  getListSuccessInvoice: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      return await InvoiceModel.getInvoicesByStatus(seller_id, "paid");
    }),

  getListRefuseInvoice: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      return await InvoiceModel.getInvoicesByStatus(seller_id, "return");
    }),

  cancelInvoice: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { invoice_id } = req.body;
      const seller_id = req.user._id;

      const invoice = await InvoiceModel.getInvoiceById(invoice_id);
      if (
        !invoice ||
        invoice.seller_id !== seller_id ||
        invoice.invoice_status !== "progress"
      ) {
        throw new Error(
          "Invoice not found, not authorized, or not in pending status"
        );
      }

      await OrderModel.updateOrderStatus(invoice.order_id, "cancelled");
      return await InvoiceModel.updateInvoiceStatus(invoice_id, "cancelled");
    }),
};

module.exports = InvoiceController;
