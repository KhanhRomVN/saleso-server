const express = require("express");
const { WishlistController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/",
    handler: WishlistController.getWishlist,
  },
  {
    method: "post",
    path: "/add",
    handler: WishlistController.addItem,
  },
  {
    method: "delete",
    path: "/remove/:productId",
    handler: WishlistController.removeItem,
  },
  {
    method: "delete",
    path: "/clear",
    handler: WishlistController.clearWishlist,
  },
];

routes.forEach(({ method, path, handler }) => {
  router[method](path, authCustomerToken, handler);
});

module.exports = router;
