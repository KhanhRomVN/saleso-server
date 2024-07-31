const express = require("express");
const { RedemptionController } = require("../../controller/index");
const { authToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    handler: RedemptionController.createRedemption,
  },
  {
    method: "get",
    path: "/discount/:discountId",
    handler: RedemptionController.getRedemptionsByDiscountId,
  },
  {
    method: "get",
    path: "/user/:userId",
    handler: RedemptionController.getRedemptionsByUserId,
  },
  {
    method: "get",
    path: "/order/:orderId",
    handler: RedemptionController.getRedemptionByOrderId,
  },
  {
    method: "get",
    path: "/total/:discountId",
    handler: RedemptionController.getTotalRedemptionsByDiscountId,
  },
  {
    method: "get",
    path: "/total-value/:discountId",
    handler: RedemptionController.getTotalValueByDiscountId,
  },
  {
    method: "delete",
    path: "/:id",
    handler: RedemptionController.deleteRedemption,
  },
];

routes.forEach(({ method, path, handler }) => {
  router[method](path, authToken, handler);
});

module.exports = router;
