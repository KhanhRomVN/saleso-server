const express = require("express");
const { OrderController } = require("../../controller/index");
const { authCustomerToken, authToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post", 
    path: "/",
    middleware: [authCustomerToken],
    handler: OrderController.createOrder,
  },
  // get list order status [pending, accepted, refused] với 2 role [customer, seller]
  {
    method: "get",
    path: "/:status",
    middleware: [authToken],
    handler: OrderController.getListOrder,
  },
  // get order with more data
  {
    method: "get",
    path: "/get/:order_id",
    handler: OrderController.getOrder,
  },
  // customer can cancel order when pending
  {
    method: "delete",
    path: "/cancel/:order_id",
    middleware: [authCustomerToken],
    handler: OrderController.cancelOrder,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
