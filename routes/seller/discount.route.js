const express = require("express");
const { DiscountController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    middleware: [authSellerToken],
    handler: DiscountController.createDiscount, 
  },
  {
    method: "get",
    path: "/by-product/:product_id",
    handler: DiscountController.getDiscountByProductId,
  },
  {
    method: "get",
    path: "/all",
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
  // {
  //   method: "get",
  //   path: "/top-used",
  //   handler: DiscountController.getTopUsedDiscounts,
  // },
  {
    method: "get",
    path: "/:id",
    handler: DiscountController.getDiscountById,
  },
  {
    method: "patch",
    path: "/:id/name",
    handler: DiscountController.updateDiscountName,
  },
  {
    method: "patch",
    path: "/:id/toggle-active",
    middleware: [authSellerToken],
    handler: DiscountController.toggleActiveDiscount,
  },
  {
    method: "post",
    path: "/apply",
    middleware: [authSellerToken],
    handler: DiscountController.applyDiscountProduct,
  },
  {
    method: "post",
    path: "/cancel",
    middleware: [authSellerToken],
    handler: DiscountController.cancelDiscountProduct,
  },
  {
    method: "delete",
    path: "/:id",
    middleware: [authSellerToken],
    handler: DiscountController.deleteDiscount,
  },
  {
    method: "post",
    path: "/:id/clone",
    middleware: [authSellerToken],
    handler: DiscountController.cloneDiscount,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
