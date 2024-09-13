const express = require("express");
const { DiscountController } = require("../../../controllers");
const { authSellerToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authSellerToken],
    handler: DiscountController.createDiscount,
  },
  {
    method: "get",
    path: "/products/:product_id",
    handler: DiscountController.getDiscountByProductId,
  },
  {
    method: "get",
    path: "/",
    middleware: [authSellerToken],
    handler: DiscountController.getAllDiscounts,
  },
  {
    method: "get",
    path: "/active",
    middleware: [authSellerToken],
    handler: DiscountController.getActiveDiscounts,
  },
  {
    method: "get",
    path: "/inactive",
    middleware: [authSellerToken],
    handler: DiscountController.getInactiveDiscounts,
  },
  {
    method: "get",
    path: "/upcoming",
    middleware: [authSellerToken],
    handler: DiscountController.getUpcomingDiscounts,
  },
  {
    method: "get",
    path: "/ongoing",
    middleware: [authSellerToken],
    handler: DiscountController.getOngoingDiscounts,
  },
  {
    method: "get",
    path: "/expired",
    middleware: [authSellerToken],
    handler: DiscountController.getExpiredDiscounts,
  },
  {
    method: "get",
    path: "/get/:id",
    handler: DiscountController.getDiscountById,
  },
  {
    method: "patch",
    path: "/:id/status",
    middleware: [authSellerToken],
    handler: DiscountController.toggleDiscountStatus,
  },
  {
    method: "put",
    path: "/products/:product_id/discounts/:discount_id",
    middleware: [authSellerToken],
    handler: DiscountController.applyDiscountToProduct,
  },
  {
    method: "delete",
    path: "/products/:product_id/discounts/:discount_id",
    middleware: [authSellerToken],
    handler: DiscountController.removeDiscountFromProduct,
  },
  {
    method: "delete",
    path: "/:id",
    middleware: [authSellerToken],
    handler: DiscountController.deleteDiscount,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
