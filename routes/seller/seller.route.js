const express = require("express");
const { SellerController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  // {
  //   method: "post",
  //   path: "/get-category",
  //   middleware: [authSellerToken],
  //   handler: SellerController.getListCategory,
  // },
  // {
  //   method: "post",
  //   path: "/add-category",
  //   middleware: [authSellerToken],
  //   handler: SellerController.addNewCategory,
  // },
];

// Register routes
routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
