const express = require("express");
const {
  authCustomerToken,
  authSellerToken,
} = require("../../../middleware/authToken");
const ReversalController = require("./reversal.controller");

const router = express.Router();

const routes = [
  // When a customer wants to reversal the product because there is a problem with the product
  {
    method: "post",
    path: "/",
    middleware: [authCustomerToken],
    handler: ReversalController.reversalOrder,
  },
  {
    method: "get",
    path: "/get/list-reversal/:status",
    middleware: [authSellerToken],
    handler: ReversalController.getListReversal,
  },
  {
    method: "get",
    path: "/get/:reversal_id",
    handler: ReversalController.getReversal,
  },
  {
    method: "get",
    path: "/replace-product",
    middleware: [authSellerToken],
    handler: ReversalController.reversalAsProductReplacement,
  },
  {
    method: "get",
    path: "/get/reversal",
    middleware: [authSellerToken],
    handler: ReversalController.reversalAsRefund,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
