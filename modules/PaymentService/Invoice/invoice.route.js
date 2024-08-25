const express = require("express");
const { InvoiceController } = require("../../../controllers");
const { authSellerToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
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
  // get list invoice by status
  {
    method: "get",
    path: "/list-invoice/:status",
    middleware: [authSellerToken],
    handler: InvoiceController.getListInvoice,
  },
  {
    method: "get",
    path: "/:invoice_id",
    handler: InvoiceController.getInvoice,
  },
  // Invoices can be canceled while still in pending status
  {
    method: "post",
    path: "/cancel",
    middleware: [authSellerToken],
    handler: InvoiceController.cancelInvoice,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
