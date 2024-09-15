const express = require("express");
const { OrderController } = require("../../../controllers");
const {
  authCustomerToken,
  authToken,
} = require("../../../middleware/authToken");
const { rateLimiter } = require('../../../middleware/rateLimiter');
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authCustomerToken, rateLimiter],
    handler: OrderController.createOrder, 
  },
  {
    method: "get",
    path: "/:status",
    middleware: [authToken, rateLimiter],
    handler: OrderController.getListOrder,  
  },
  {
    method: "get",
    path: "/get/:order_id",
    middleware: [authToken, rateLimiter],
    handler: OrderController.getOrder,
  },
  {
    method: "delete",
    path: "/cancel/:order_id",
    middleware: [authCustomerToken, rateLimiter],
    handler: OrderController.cancelOrder,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;