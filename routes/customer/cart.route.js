const express = require("express");
const { CartController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/",
    handler: CartController.getCart,
  },
  {
    method: "post",
    path: "/add",
    handler: CartController.addItem,
  },
  {
    method: "put",
    path: "/update",
    handler: CartController.updateItem,
  },
  {
    method: "delete",
    path: "/remove/:productId",
    handler: CartController.removeItem,
  },
  {
    method: "delete",
    path: "/clear",
    handler: CartController.clearCart,
  },
];

routes.forEach(({ method, path, handler }) => {
  router[method](path, authCustomerToken, handler);
});

module.exports = router;
