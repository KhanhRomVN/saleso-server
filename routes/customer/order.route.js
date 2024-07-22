const express = require("express");
const { OrderController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

router.post("/", authCustomerToken, OrderController.getListOrder);
router.post("/accepted", authCustomerToken, OrderController.getListAcceptOrder);
router.post("/rejected", authCustomerToken, OrderController.getListRefuseOrder);
router.post("/create", authCustomerToken, OrderController.createOrder);
router.post(
  "/cancel/:order_id",
  authCustomerToken,
  OrderController.cancelOrder
);

module.exports = router;
