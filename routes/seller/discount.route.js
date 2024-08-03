const express = require("express");
const { DiscountController } = require("../../controller/index");
const { authSellerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    handler: DiscountController.createDiscount,
  },
  { method: "get", path: "/all", handler: DiscountController.getAllDiscounts },
  {
    method: "get",
    path: "/active",
    handler: DiscountController.getActiveDiscounts,
  },
  {
    method: "get",
    path: "/inactive",
    handler: DiscountController.getInactiveDiscounts,
  },
  {
    method: "get",
    path: "/upcoming",
    handler: DiscountController.getUpcomingDiscounts,
  },
  {
    method: "get",
    path: "/ongoing",
    handler: DiscountController.getOngoingDiscounts,
  },
  {
    method: "get",
    path: "/expired",
    handler: DiscountController.getExpiredDiscounts,
  },
  // {
  //   method: "get",
  //   path: "/top-used",
  //   handler: DiscountController.getTopUsedDiscounts,
  // },
  { method: "get", path: "/:id", handler: DiscountController.getDiscountById },
  {
    method: "patch",
    path: "/:id/name",
    handler: DiscountController.updateDiscountName,
  },
  {
    method: "patch",
    path: "/:id/toggle-active",
    handler: DiscountController.toggleActiveDiscount,
  },
  {
    method: "post",
    path: "/apply",
    handler: DiscountController.applyDiscountProduct,
  },
  {
    method: "post",
    path: "/cancel",
    handler: DiscountController.cancelDiscountProduct,
  },
  {
    method: "delete",
    path: "/:id",
    handler: DiscountController.deleteDiscount,
  },
  {
    method: "post",
    path: "/:id/clone",
    handler: DiscountController.cloneDiscount,
  },
];

routes.forEach(({ method, path, handler }) => {
  router[method](path, authSellerToken, handler);
});

module.exports = router;
