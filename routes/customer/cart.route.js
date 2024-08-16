const express = require("express");
const { CartController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/",
    middleware: [authCustomerToken],
    handler: CartController.getCart,
  },
  {
    method: "post",
    path: "/",
    middleware: [authCustomerToken],
    handler: CartController.addItem,
  },
  {
    method: "delete",
    path: "/:product_id",
    middleware: [authCustomerToken],
    handler: CartController.removeItem,
  },
  {
    method: "patch",
    path: "/",
    middleware: [authCustomerToken],
    handler: CartController.updateItemQuantity,
  },
  {
    method: "delete",
    path: "/",
    middleware: [authCustomerToken],
    handler: CartController.clearCart,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
