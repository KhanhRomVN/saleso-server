const express = require("express");
const { CartController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

router.post("/", authCustomerToken, CartController.getListProductOfCart);
router.post("/", authCustomerToken, CartController.addCart);
router.post("/:product_id", authCustomerToken, CartController.delCart);
router.post("/", authCustomerToken, CartController.delCarts);

module.exports = router;
