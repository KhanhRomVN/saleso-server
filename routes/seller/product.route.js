const express = require("express");
const { ProductController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    middleware: [authSellerToken],
    handler: ProductController.createProduct,
  },
  {
    method: "post",
    path: "/:product_id",
    handler: ProductController.getProductById,
  },
  {
    method: "post",
    path: "/user/:seller_id",
    handler: ProductController.getProductsBySellerId,
  },
  {
    method: "post",
    path: "/category/:category",
    handler: ProductController.getProductsByCategory,
  },
  { method: "post", path: "/all", handler: ProductController.getAllProducts },
  {
    method: "post",
    path: "/update/:product_id",
    middleware: [authSellerToken],
    handler: ProductController.updateProduct,
  },
  {
    method: "post",
    path: "/delete/:product_id",
    middleware: [authSellerToken],
    handler: ProductController.deleteProduct,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
