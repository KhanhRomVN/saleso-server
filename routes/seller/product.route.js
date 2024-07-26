const express = require("express");
const { ProductController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const { ObjectId } = require("mongodb");
const router = express.Router();

const validateObjectId = (req, res, next) => {
  const id = req.params.product_id || req.params.seller_id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  next();
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
    middleware: [validateObjectId],
    handler: ProductController.getProductById,
  },
  {
    method: "get",
    path: "/seller/:seller_id",
    handler: ProductController.getProductsBySellerId,
  },
  {
    method: "get",
    path: "/category/:category",
    handler: ProductController.getProductsByCategory,
  },
  {
    method: "get",
    path: "/discount/flash-sale",
    handler: ProductController.getProductsFlashsale,
  },
  { method: "get", path: "/all", handler: ProductController.getAllProducts },
  {
    method: "put",
    path: "/update/:product_id",
    middleware: [authSellerToken, validateObjectId],
    handler: ProductController.updateProduct,
  },
  {
    method: "delete",
    path: "/delete/:product_id",
    middleware: [authSellerToken, validateObjectId],
    handler: ProductController.deleteProduct,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
