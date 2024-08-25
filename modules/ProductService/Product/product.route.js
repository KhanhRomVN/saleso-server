const express = require("express");
const { ProductController } = require("../../../controllers");
const { authSellerToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    middleware: [authSellerToken],
    handler: ProductController.createProduct,
  },
  {
    method: "get",
    path: "/:product_id",
    handler: ProductController.getProductById,
  },
  {
    method: "post",
    path: "/by-seller",
    middleware: [authSellerToken],
    handler: ProductController.getProductsBySellerId,
  },
  {
    method: "get",
    path: "/discount/by-seller/:seller_id",
    handler: ProductController.getProductsWithDiscountBySellerId,
  },
  {
    method: "post",
    path: "/all",
    handler: ProductController.getAllProduct,
  },
  {
    method: "post",
    path: "/flash-sale",
    handler: ProductController.getFlashSaleProducts,
  },
  {
    method: "post",
    path: "/top-sell",
    handler: ProductController.getTopSellingProducts,
  },
  {
    method: "get",
    path: "/by-category/:category",
    handler: ProductController.getProductsByCategory,
  },
  {
    method: "post",
    path: "/by-categories",
    handler: ProductController.getProductsByCategories,
  },
  // {
  //   method: "post",
  //   path: "/filter",
  //   handler: ProductController.filterProducts,
  // },
  {
    method: "put",
    path: "/update/:product_id",
    middleware: [authSellerToken],
    handler: ProductController.updateProduct,
  },
  {
    method: "delete",
    path: "/delete/:product_id",
    middleware: [authSellerToken],
    handler: ProductController.deleteProduct,
  },
  {
    method: "put",
    path: "/update-stock/:product_id",
    middleware: [authSellerToken],
    handler: ProductController.updateProductStock,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
