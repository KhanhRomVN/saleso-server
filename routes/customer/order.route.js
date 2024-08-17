const express = require("express");
const { OrderController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authCustomerToken],
    handler: OrderController.createOrder,
  },
  {
    method: "get",
    path: "/",
    middleware: [authCustomerToken],
    handler: OrderController.getOrder,
  },
  {
    method: "get",
    path: "/accept",
    middleware: [authCustomerToken],
    handler: OrderController.getAcceptOrder,
  },
  {
    method: "get",
    path: "/refuse",
    middleware: [authCustomerToken],
    handler: OrderController.getRefuseOrder,
  },
  {
    method: "post",
    path: "/cancel/order_id",
    middleware: [authCustomerToken],
    handler: OrderController.cancelOrder,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
