const express = require("express");
const { authSellerToken } = require("../../../middleware/authToken");
const RefundController = require("./refund.controller");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/list/:status",
    middleware: [authSellerToken],
    handler: RefundController.getListRefund,
  },
  {
    method: "get",
    path: "/:refund_id",
    handler: RefundController.getRefund,
  },
  {
    method: "get",
    path: "/accept/:refund_id",
    middleware: [authSellerToken],
    handler: RefundController.acceptRefund,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
