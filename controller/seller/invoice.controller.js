const {
  InvoiceModel,
  OrderModel,
  ProductModel,
} = require("../../models/index");
const UserController = require("../user/user.controller");

const handleAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const addToInvoice = async (orderProduct, order_id) => {
  const userData = await UserController.getUserDataByIdServerSide(
    orderProduct.customer_id,
    "customer"
  );
  const invoice = {
    seller_id: orderProduct.seller_id,
    customer_id: orderProduct.customer_id,
    email: userData.email,
    username: userData.username,
    order_id: order_id.toString(),
    total_amount: orderProduct.total_amount,
    payment_status: orderProduct.payment_status,
    invoice_status: "pending",
    currency: "VND",
  };
  await InvoiceModel.addToInvoice(invoice);
};

const getListInvoice = handleAsync(async (req, res) => {
  const seller_id = req.user._id.toString();
  const listInvoice = await InvoiceModel.getListInvoice(seller_id);
  res.status(200).json(listInvoice);
});

const getInvoiceById = handleAsync(async (req, res) => {
  const { invoice_id } = req.params;
  const invoiceData = await InvoiceModel.getInvoiceById(invoice_id);
  if (!invoiceData) {
    return res.status(404).json({ error: "Invoice not found" });
  }
  const orderData = await OrderModel.getOrderById(invoiceData.order_id);
  const productData = await ProductModel.getProductByProdId(
    orderData.product_id
  );
  res.status(200).json({ invoiceData, orderData, productData });
});

const getListInvoiceByStatus = handleAsync(async (req, res, status) => {
  const seller_id = req.user._id.toString();
  const listInvoice = await InvoiceModel.getListInvoiceByStatus(
    seller_id,
    status
  );
  res.status(200).json(listInvoice);
});

const acceptInvoice = handleAsync(async (req, res) => {
  const { invoice_id } = req.params;
  const invoiceData = await InvoiceModel.getInvoiceById(invoice_id);
  await InvoiceModel.updateInvoiceStatus(invoice_id, "accepted", "in transit");
  await OrderModel.updateOrderStatus(
    invoiceData.order_id,
    "accepted",
    "in transit"
  );
  const orderData = await OrderModel.getOrderById(invoiceData.order_id);
  await ProductModel.subtractStock(orderData.product_id, orderData.quantity);
  res.status(200).json("Accepted Invoice");
});

const refuseInvoice = handleAsync(async (req, res) => {
  const { invoice_id } = req.params;
  const updatedInvoice = await InvoiceModel.updateInvoiceStatus(
    invoice_id,
    "refused"
  );
  if (!updatedInvoice) {
    return res
      .status(404)
      .json({ error: "Invoice not found or not authorized" });
  }
  const updateOrder = await OrderModel.updateOrderStatus(
    invoiceData.order_id,
    "refused",
    "cancel"
  );
  if (!updateOrder) {
    return res.status(404).json({ error: "Order not found or not authorized" });
  }
  res.status(200).json(updatedInvoice);
});

module.exports = {
  addToInvoice,
  getListInvoice,
  getInvoiceById,
  getListAcceptInvoice: (req, res) =>
    getListInvoiceByStatus(req, res, "accepted"),
  getListRefuseInvoice: (req, res) =>
    getListInvoiceByStatus(req, res, "refused"),
  acceptInvoice,
  refuseInvoice,
};
