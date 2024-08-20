const {
  InvoiceModel,
  OrderModel,
  PaymentModel,
  UserModel,
  DiscountModel,
  ProductModel,
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
  acceptOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      const { order_id, due_date } = req.body;
      console.log(seller_id);

      // auth
      const order = await OrderModel.getOrderById(order_id);
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

      // create invoice
      const invoice = await InvoiceModel.createInvoice(invoiceData);
      await PaymentModel.createInvoice(invoice, order_id);

      return { message: "Create invoice successfully" };
    }),

  refuseOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { order_id } = req.body;
      const seller_id = req.user._id.toString();

      // auth
      const order = await OrderModel.getOrderById(order_id);
      if (!order || order.seller_id !== seller_id) {
        throw new Error("Order not found or not authorized");
      }

      // change order status
      await OrderModel.updateOrderStatus(order_id, "refused");
      await PaymentModel.refuseOrder(order_id);
      return { message: "Refuse Order" };
    }),

  getListInvoice: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { status } = req.params;
      const seller_id = req.user._id.toString();
      return await InvoiceModel.getListInvoiceByStatus(seller_id, status);
    }),

  getInvoice: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { invoice_id } = req.params;
      const invoice = await InvoiceModel.getInvoiceById(invoice_id);
      const customer = await UserModel.getUserById(
        invoice.customer_id,
        "customer"
      );
      const order = await OrderModel.getOrderById(invoice.order_id);
      const product = await ProductModel.getProductByProdId(order.product_id);
      const payment = await PaymentModel.getPayment(invoice.order_id);

      let discount = null;
      if (order.discount_id) {
        discount = await DiscountModel.getDiscountById(order.discount_id);
      }

      let selectedAttribute = null;
      if (order.selected_attributes_value) {
        selectedAttribute = product.attributes.find(
          (attr) => attr.attributes_value === order.selected_attributes_value
        );
      }

      const invoiceCustom = {
        // invoice
        invoice_id: invoice._id,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        invoice_status: invoice.invoice_status,
        logs: invoice.logs,
        // seller
        seller_id: invoice.seller_id,
        // customer
        customer_id: invoice.customer_id,
        customer_username: customer.username,
        customer_email: customer.email,
        // product
        product_id: order.product_id,
        product_name: product.name,
        product_image: product.images[0],
        product_price: selectedAttribute
          ? selectedAttribute.attributes_price
          : product.price,
        // order
        quantity: order.quantity,
        shipping_fee: order.shipping_fee,
        shipping_address: order.shipping_address,
        // payment
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        // total
        total_amount: order.total_amount,
      };

      if (selectedAttribute) {
        invoiceCustom.product_attributes_value =
          selectedAttribute.attributes_value;
      }

      if (discount) {
        invoiceCustom.discount_id = order.discount_id;
        invoiceCustom.discount_type = discount.type;
        invoiceCustom.discount_value =
          typeof discount.value === "number"
            ? discount.value
            : `Buy ${discount.value.buyQuantity} get ${discount.value.getFreeQuantity}`;
      }

      return invoiceCustom;
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
