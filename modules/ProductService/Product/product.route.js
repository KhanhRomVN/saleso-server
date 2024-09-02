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
  // Search products by name and tag
  {
    method: "post",
    path: "/elastic/search",
    handler: ProductController.searchProduct,
  },
  // Search for products via name, country, brand, tag. In addition, there is also the ability to filter products by price (arrange highest or lowest selling price), units_sold (sort sold products) and sort rate (level of product rating).
  {
    method: "post",
    path: "/elastic/filter",
    handler: ProductController.filterProducts,
  },
  {
    method: "post",
    path: "/elastic/category/filter",
    handler: ProductController.categoryFilterProducts,
  },
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
  // admin only: when using this function, the server deletes all data of the elasticsearch "products" index. Then it retrieves all data of the "products" collection from mongoDB and reassigns it to the elasticsearch "products" index.
  {
    method: "get",
    path: "/refresh/products",
    handler: ProductController.refreshProduct,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
