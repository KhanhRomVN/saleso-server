const express = require("express");
const { InvoiceController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const router = express.Router();

router.post("/", authSellerToken, InvoiceController.getListInvoice);
router.post(
  "/get/:invoice_id",
  authSellerToken,
  InvoiceController.getInvoiceById
);
router.post(
  "/accepted",
  authSellerToken,
  InvoiceController.getListAcceptInvoice
);
router.post(
  "/refused",
  authSellerToken,
  InvoiceController.getListRefuseInvoice
);
router.post(
  "/action/accept/:invoice_id",
  authSellerToken,
  InvoiceController.acceptInvoice
);
router.post(
  "/action/refuse/:invoice_id",
  authSellerToken,
  InvoiceController.refuseInvoice
);

module.exports = router;
