const express = require("express");
const { ProductController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const { redisClient } = require("../../config/redisClient");
const router = express.Router();

const cacheMiddleware = (duration) => async (req, res, next) => {
  const key = `product:${req.originalUrl}`;
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) return res.json(JSON.parse(cachedData));

    res.sendResponse = res.json;
    res.json = (body) => {
      redisClient.setEx(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    next();
  } catch (error) {
    console.error("Redis cache error:", error);
    next();
  }
};

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
    middleware: [cacheMiddleware(300)], // Cache for 5 minutes
    handler: ProductController.getProductById,
  },
  {
    method: "get",
    path: "/by-seller/:seller_id",
    // middleware: [cacheMiddleware(600)],
    handler: ProductController.getProductsBySellerId,
  },
  {
    method: "get",
    path: "/discount/by-seller/:seller_id",
    handler: ProductController.getProductsWithDiscountBySellerId,
  },
  {
    method: "get",
    path: "/by-category/:category",
    middleware: [cacheMiddleware(600)],
    handler: ProductController.getProductsByCategory,
  },
  {
    method: "post",
    path: "/all-product",
    middleware: [cacheMiddleware(1800)],
    handler: ProductController.getAllProducts,
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
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
