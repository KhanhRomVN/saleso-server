const express = require("express");
const { InvoiceController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  // Get a list of pending orders
  {
    method: "get",
    path: "/",
    middleware: [authSellerToken],
    handler: InvoiceController.getListPendingOrder,
  },
  // Get pending orders (more information)
  {
    method: "get",
    path: "/by-order/:order_id",
    middleware: [authSellerToken],
    handler: InvoiceController.getOrder,
  },
  // Accept the order then create an invoice
  {
    method: "post",
    path: "/accept",
    middleware: [authSellerToken],
    handler: InvoiceController.acceptOrder,
  },
  {
    method: "post",
    path: "/refuse",
    middleware: [authSellerToken],
    handler: InvoiceController.refuseOrder,
  },
  // Get list pending invoices (meaning the invoice has not been paid or the order has not yet reached the recipient)
  {
    method: "get",
    path: "/list-invoice/progress",
    middleware: [authSellerToken],
    handler: InvoiceController.getListProgressInvoice,
  },
  // The invoice has arrived and the recipient has paid for the order
  {
    method: "get",
    path: "/list-invoice/success",
    middleware: [authSellerToken],
    handler: InvoiceController.getListSuccessInvoice,
  },
  // Invoices fail for many reasons such as the recipient refusing to accept the goods
  {
    method: "get",
    path: "/list-invoice/refuse",
    middleware: [authSellerToken],
    handler: InvoiceController.getListRefuseInvoice,
  },
  // Invoices can be canceled while still in pending status
  {
    method: "get",
    path: "/invoice/cancel",
    middleware: [authSellerToken],
    handler: InvoiceController.cancelInvoice,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
